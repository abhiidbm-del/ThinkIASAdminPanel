import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { AfterViewChecked, Component, ElementRef, inject, OnDestroy, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../shared/services/auth.service';
import { TestService } from '../../shared/services/test.service';
import { PaymentDialogComponent } from './payment-dialog/payment-dialog.component';
import { UserService } from '../../shared/services/user.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  private authService = inject(AuthService);
  private testService = inject(TestService);
    private userService = inject(UserService);

  private router = inject(Router);
  private dialog = inject(MatDialog);

  currentUser = this.authService.currentUser;
  upcomingTests = signal<any[]>([]);
  recentResults = signal<any[]>([]);
  completedTestsCount = signal<number>(0);
  totalTestsCount = signal<number>(0);
  totalStudentsCount = signal<number>(0);
  totalResultsCount = signal<number>(0);
  
  loading = signal<boolean>(true);
  statisticsError = signal('');
  chartData = signal<any>(null);
  @ViewChild('overviewChart') overviewChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityChart') activityChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('resultsTrendChart') resultsTrendChart?: ElementRef<HTMLCanvasElement>;
  private chartInstances: Chart[] = [];

  ngOnInit() {
    const user = this.currentUser();
    
    if (user?.role === 'student') {
      if (user.type === 'fresh') {
        this.loadFreshStudentData();
      } else if (user.type === 'pre') {
        this.loadPreStudentData();
      }
    } else if (user?.role === 'admin') {
      this.loadAdminData();
    }
  }

  ngOnDestroy() {
    this.chartInstances.forEach(chart => chart.destroy());
  }

  ngAfterViewChecked() {
    if (this.currentUser()?.role === 'admin' && this.chartData() && !this.chartInstances.length) {
      this.renderAdminCharts();
    }
  }

  // Open payment dialog
  openPaymentDialog(plan: 'pre' | 'mains' | 'combo') {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { selectedPlan: plan },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Payment was successful, reload user data
        console.log('Payment completed successfully');
        // You can add logic here to refresh the user data if needed
      } else {
        console.log('Payment cancelled');
      }
    });
  }

  loadFreshStudentData() {
    this.loading.set(true);
    
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);

    // this.testService.getUpcomingTests().subscribe({
    //   next: (tests) => {
    //     this.upcomingTests.set(tests.slice(0, 2));
    //   },
    //   error: (error) => {
    //     console.error('Error loading upcoming tests:', error);
    //   }
    // });
  }

  loadPreStudentData() {
    this.loading.set(true);
    
    this.testService.getUpcomingTests().subscribe({
      next: (tests) => {
        this.upcomingTests.set(tests.slice(0, 3));
      },
      error: (error) => {
        console.error('Error loading upcoming tests:', error);
      }
    });

    this.testService.getStudentResults().subscribe({
      next: (results) => {
        this.recentResults.set(results.slice(0, 5));
        this.completedTestsCount.set(results.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading student results:', error);
        this.loading.set(false);
      }
    });
  }

  loadAdminData() {
    this.loading.set(true);
    this.statisticsError.set('');
    
    this.testService.getPlatformStatistics().subscribe({
      next: (stats) => {
        if (![stats?.totalStudents, stats?.totalResults, stats?.totalTests].every(value => Number.isInteger(value) && value >= 0)) {
          this.statisticsError.set('Dashboard counts could not be loaded. Please retry.');
          this.loading.set(false);
          return;
        }
        this.totalStudentsCount.set(stats.totalStudents);
        this.totalResultsCount.set(stats.totalResults);
        this.totalTestsCount.set(stats.totalTests);
        this.loading.set(false);
        this.loadAdminChartData();
      },
      error: (error) => {
        console.error('Error loading platform statistics:', error);
        this.statisticsError.set('Dashboard counts could not be loaded. Please retry.');
        this.loading.set(false);
      }
    });
  }

  private loadAdminChartData() {
    this.testService.getDashboardCharts().subscribe({
      next: (data) => {
        this.chartData.set(data);
        setTimeout(() => this.renderAdminCharts());
      },
      error: error => console.error('Error loading dashboard chart data:', error)
    });
  }

  private renderAdminCharts() {
    const data = this.chartData();
    if (!data || !this.overviewChart?.nativeElement) return;

    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances = [];

    const { overview, activity, resultsTrend } = data;

    this.chartInstances.push(new Chart(this.overviewChart.nativeElement, {
      type: 'doughnut',
      data: { labels: ['Students', 'Tests', 'Results'], datasets: [{ data: [overview.totalStudents, overview.totalTests, overview.totalResults], backgroundColor: ['#1d5374', '#198754', '#e8793d'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom' } } }
    }));

    this.chartInstances.push(new Chart(this.activityChart!.nativeElement, {
      type: 'bar',
      data: { labels: ['Available tests', 'Submitted results'], datasets: [{ label: 'Count', data: [activity.totalTests, activity.totalResults], backgroundColor: ['#1d5374', '#198754'], borderRadius: 8, maxBarThickness: 54 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e8eef2' } }, x: { grid: { display: false } } } }
    }));

    this.chartInstances.push(new Chart(this.resultsTrendChart!.nativeElement, {
      type: 'line',
      data: { labels: resultsTrend.map((point: any) => point.date), datasets: [{ label: 'Results', data: resultsTrend.map((point: any) => point.count), borderColor: '#e8793d', backgroundColor: 'rgba(232, 121, 61, .12)', fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e8eef2' } }, x: { grid: { display: false } } } }
    }));
  }


  getRecentPerformance(): string {
    const results = this.recentResults();
    if (results.length === 0) return 'No tests taken yet';
    
    const avgPercentage = results.reduce((sum, result) => sum + parseFloat(result.percentage), 0) / results.length;
    return `Average: ${avgPercentage.toFixed(1)}%`;
  }

  navigateToStudentsList() {
    this.router.navigate(['/students-list']);
  }

  // getMe(){
  //   this.userService.getMe().subscribe({
  //     next: (results:any) => {
  //       console.log(results)
  //     },
  //     error: (error:any) => {
  //       // console.error('Error loading results:', error);
  //       // this.loading.set(false);
  //     }
  //   });
  // }
}
