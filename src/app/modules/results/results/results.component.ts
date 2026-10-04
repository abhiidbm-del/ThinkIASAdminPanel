import { Component, inject, signal, OnInit, TemplateRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { TestService, TestResult } from '../../../shared/services/test.service';
import { AuthService } from '../../../shared/services/auth.service';
import { UserService } from '../../../shared/services/user.service';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { MatChip } from '@angular/material/chips';

interface ChatMessage {
  _id: string;
  result: string;
  sender: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  receiver: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  message: string;
  isEdited: boolean;
  isRead: boolean;
  readAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  _id: string;
  fullName: string;
  email: string;
}

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
    FormsModule,
    // TruncatePipe,
    MatChip,
  ],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit, AfterViewChecked {
  @ViewChild('sendQueryDialog') sendQueryDialog!: TemplateRef<any>;
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;

  private testService = inject(TestService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  // Signals
  results = signal<TestResult[]>([]);
  students = signal<Student[]>([]);
  chatMessages = signal<ChatMessage[]>([]);
  loading = signal(false);
  chatLoading = signal(false);
  
  // State
  displayedColumns: string[] = ['test', 'score', 'percentage', 'rank', 'submittedAt', 'actions'];
  newMessage = '';
  selectedResult: any = null;
  dialogRef!: MatDialogRef<any>;
  editingMessage: ChatMessage | null = null;
  currentUserId: string = '';
  selectedStudentId: string = '';
  
  private chatPollingSubscription!: Subscription;

  ngOnInit() {
    this.loadAllStudents();
    const currentUser = this.authService.currentUser();
    this.currentUserId = currentUser?.id || '';
    
    // Get studentId from query params
    this.route.queryParams.subscribe(params => {
      const studentId = params['studentId'];
      if (studentId) {
        this.selectedStudentId = studentId;
        this.loadStudentResults(studentId);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.chatMessagesContainer) {
      this.chatMessagesContainer.nativeElement.scrollTop = 
        this.chatMessagesContainer.nativeElement.scrollHeight;
    }
  }

  loadAllStudents() {
    this.userService.getAllStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        if (students.length > 0 && !this.selectedStudentId) {
          this.selectedStudentId = students[0]._id;
          this.loadStudentResults(this.selectedStudentId);
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  loadStudentResults(studentId: string) {
    this.loading.set(true);
    this.userService.getStudentResultsByAdmin(studentId).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading student results:', error);
        this.loading.set(false);
      }
    });
  }

  onStudentChange(event: any) {
    this.selectedStudentId = event.value;
    this.loadStudentResults(this.selectedStudentId);
  }

  getStudentName(): string {
    const student = this.students().find(s => s._id === this.selectedStudentId);
    return student ? student.fullName : 'Student';
  }

  // Calculate unread count from chat messages
  getUnreadCount(resultId: string): number {
    if (!this.chatMessages() || this.chatMessages().length === 0) return 0;
    
    return this.chatMessages().filter(msg => 
      msg.result === resultId && 
      !msg.isRead && 
      msg.receiver._id === this.currentUserId
    ).length;
  }

  viewDetailedResult(result: TestResult) {
    this.router.navigate(['/result-detail', result._id], {
      queryParams: { 
        testId: result.test._id,
        studentId: this.selectedStudentId 
      }
    });
  }

  getRankColor(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return '#cd7f32';
    return '';
  }

  getOrdinalSuffix(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  // Chat Methods
  openChat(result: any) {
    this.selectedResult = result;
    this.newMessage = '';
    this.editingMessage = null;
    this.chatMessages.set([]);

    this.dialogRef = this.dialog.open(this.sendQueryDialog, {
      width: '600px',
      height: '700px',
      disableClose: false
    });

    this.loadChatMessages(result._id);
    this.startChatPolling(result._id);
  }

  loadChatMessages(resultId: string) {
    this.chatLoading.set(true);
    this.testService.getChatMessages(resultId).subscribe({
      next: (messages: ChatMessage[]) => {
        this.chatMessages.set(messages);
        this.chatLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading chat messages:', error);
        this.chatLoading.set(false);
      }
    });
  }

  startChatPolling(resultId: string) {
    // Stop any existing polling
    if (this.chatPollingSubscription) {
      this.chatPollingSubscription.unsubscribe();
    }

    // Poll every 10 seconds
    this.chatPollingSubscription = interval(10000).pipe(
      switchMap(() => this.testService.getChatMessages(resultId))
    ).subscribe({
      next: (messages: ChatMessage[]) => {
        this.chatMessages.set(messages);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error polling chat messages:', error);
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedResult) return;

    if (this.editingMessage) {
      this.updateMessage();
    } else {
      const messageData = {
        result: this.selectedResult._id,
        message: this.newMessage.trim()
      };

      this.testService.sendMessage(messageData).subscribe({
        next: (message: ChatMessage) => {
          this.chatMessages.update(messages => [...messages, message]);
          this.newMessage = '';
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      });
    }
  }

  updateMessage() {
    if (!this.editingMessage || !this.newMessage.trim()) return;

    this.testService.updateMessage(this.editingMessage._id, this.newMessage.trim()).subscribe({
      next: (updatedMessage: ChatMessage) => {
        this.chatMessages.update(messages => 
          messages.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
        );
        this.cancelEdit();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error updating message:', error);
      }
    });
  }

  deleteMessage(message: ChatMessage) {
    if (confirm('Are you sure you want to delete this message?')) {
      this.testService.deleteMessage(message._id).subscribe({
        next: () => {
          this.chatMessages.update(messages => 
            messages.filter(msg => msg._id !== message._id)
          );
        },
        error: (error) => {
          console.error('Error deleting message:', error);
        }
      });
    }
  }

  editMessage(message: ChatMessage) {
    this.editingMessage = message;
    this.newMessage = message.message;
  }

  cancelEdit() {
    this.editingMessage = null;
    this.newMessage = '';
  }

  onEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  closeChatDialog() {
    if (this.chatPollingSubscription) {
      this.chatPollingSubscription.unsubscribe();
    }
    
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  // Helper method to check if user can delete message
  canDeleteMessage(message: ChatMessage): boolean {
    return message.sender._id === this.currentUserId || true; // Admin can delete any message
  }

  getParticipantName(): string {
    if (!this.selectedResult) return '';
    const student = this.students().find(s => s._id === this.selectedStudentId);
    return student ? `Chatting with ${student.fullName}` : 'Chat';
  }
}