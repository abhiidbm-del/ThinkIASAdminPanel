import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';
import { ResourcesViewComponent } from './shared/components/resources-view/resources-view.component';
import { QuizDetailsComponent } from './modules/admin/quizzes/quiz-details/quiz-details.component';
import { QuizzesComponent } from './modules/admin/quizzes/quizzes.component';
import { ManageCouponComponent } from './modules/admin/manage-coupon/manage-coupon.component';

export const routes: Routes = [
  {path:'program-faqs',loadComponent:()=>import('./modules/admin/program-faqs/program-faqs.component').then(m=>m.ProgramFaqsComponent),canActivate:[authGuard,roleGuard],data:{role:'admin'}},
  { path: 'students/:id', loadComponent: () => import('./modules/admin/student-profile/student-profile.component').then(m => m.StudentProfileComponent), canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  // { path: 'careers', loadComponent: () => import('./modules/admin/careers/careers.component').then(m => m.CareersComponent), canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'notifications', loadComponent: () => import('./modules/admin/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  // { path: 'exam-monitoring', loadComponent: () => import('./modules/admin/exam-monitoring/exam-monitoring.component').then(m => m.ExamMonitoringComponent), canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  { path: 'manage-plans', loadComponent: () => import('./modules/admin/manage-plans/manage-plans.component').then(m => m.ManagePlansComponent), canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  // { 
  //   path: 'landing-page', 
  //   loadComponent: () => import('./modules/landing-page/landing-page.component').then(m => m.LandingPageComponent)
  // },
  // { 
  //   path: 'homepage', 
  //   loadComponent: () => import('./modules/homepage/homepage.component').then(m => m.HomepageComponent)
  // },
  { 
    path: 'login', 
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent)
  },
  // { 
  //   path: 'register', 
  //   loadComponent: () => import('./modules/auth/register/register.component').then(m => m.RegisterComponent)
  // },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'prelims-tests', 
    loadComponent: () => import('./modules/tests/live-tests/live-tests.component').then(m => m.LiveTestsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'manage-tests', 
    loadComponent: () => import('./modules/tests/live-tests/live-tests.component').then(m => m.LiveTestsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'take-test/:id', 
    loadComponent: () => import('./modules/tests/take-test/take-test.component').then(m => m.TakeTestComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  { 
    path: 'prelims-results', 
    loadComponent: () => import('./modules/results/results/results.component').then(m => m.ResultsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'admin-results', 
    loadComponent: () => import('./modules/results/admin-results/admin-results.component').then(m => m.AdminResultsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'result-detail/:id', 
    loadComponent: () => import('./modules/results/result-detail/result-detail.component').then(m => m.ResultDetailComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'students-list', 
    loadComponent: () => import('./modules/admin/students-list/students-list.component').then(m => m.StudentsListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
    { path: 'view/:type', component: ResourcesViewComponent }, 
    { 
    path: 'syllabus-master', 
    loadComponent: () => import('./modules/admin/syllabus-master/syllabus-master.component').then(m => m.SyllabusMasterComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
  path: 'tag-master', 
  loadComponent: () => import('./modules/admin/tag-master/tag-master.component').then(m => m.TagMasterComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
  path: 'questions-master', 
  loadComponent: () => import('./modules/admin/questions-master/questions-master.component').then(m => m.QuestionsMasterComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
  path: 'directory-master', 
  loadComponent: () => import('./modules/admin/directory-master/directory-master.component').then(m => m.DirectoryMasterComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
    path: 'support-tickets',
    loadComponent: () => import('./modules/admin/support-tickets/support-tickets.component').then(m => m.SupportTicketsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
  path: 'meeting-admin', 
  loadComponent: () => import('./modules/admin/meeting-admin/meeting-admin.component').then(m => m.MeetingAdminComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin', audience: 'pre' }
  },
  {
  path: 'mains-meeting-admin', 
  loadComponent: () => import('./modules/admin/meeting-admin/meeting-admin.component').then(m => m.MeetingAdminComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin', audience: 'mains' }
  },
  {
  path: 'admin-mentorship', 
  loadComponent: () => import('./modules/admin/admin-mentorship/admin-mentorship.component').then(m => m.AdminMentorshipComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
    path: 'announcement-master', 
    loadComponent: () => import('./modules/admin/announcement-master/announcement-master.component').then(m => m.AnnouncementMasterComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'testimonials',
    loadComponent: () => import('./modules/admin/testimonials/testimonials.component').then(m => m.TestimonialsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'support-features',
    loadComponent: () => import('./modules/admin/support-features/support-features.component').then(m => m.SupportFeaturesComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
  path: 'free-resource-admin', 
  loadComponent: () => import('./modules/admin/free-resource-admin/free-resource-admin.component').then(m => m.FreeResourceAdminComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
  path: 'simple-news-admin', 
  loadComponent: () => import('./modules/admin/simple-news-admin/simple-news-admin.component').then(m => m.SimpleNewsAdminComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
  path: 'live-content-admin', 
  loadComponent: () => import('./modules/admin/live-content-admin/live-content-admin.component').then(m => m.LiveContentAdminComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },

  {
  path: 'demo-test-admin', 
  loadComponent: () => import('./modules/tests/demo-tests/demo-tests.component').then(m => m.DemoTestsComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  { path: 'quizzes', component: QuizzesComponent, canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  { path: 'quizzes/:id', component: QuizDetailsComponent, canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
  {
    path: 'manage-coupon', 
    loadComponent: () => import('./modules/admin/manage-coupon/manage-coupon.component').then(m => m.ManageCouponComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },

    {
    path: 'study-module', 
    loadComponent: () => import('./modules/admin/study-module/study-module.component').then(m => m.StudyModuleComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },

    {
    path: 'manage-program', 
    loadComponent: () => import('./modules/admin/manage-programs/manage-programs.component').then(m => m.ManageProgramsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },

    {
    path: 'answer-writing', 
    loadComponent: () => import('./modules/admin/admin-answer-writing/admin-answer-writing.component').then(m => m.AdminAnswerWritingComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },

    {
    path: 'live-test', 
    loadComponent: () => import('./modules/admin/live-test/live-test.component').then(m => m.AdminLiveTestComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },

    {
    path: 'prelims-test-series', 
    loadComponent: () => import('./modules/admin/prelims-test-series/prelims-test-series.component').then(m => m.PrelimsTestSeriesComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },
    {
    path: 'mains-test-series', 
    loadComponent: () => import('./modules/admin/mains-test-series/mains-test-series.component').then(m => m.MainsTestSeriesComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
    },
  { path: '**', component: PageNotFoundComponent }

];
