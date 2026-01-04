import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { LayoutComponent } from './components/layout/layout.component';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'forgot-password/:token',
    component: ResetPasswordComponent,
    canActivate: [publicGuard]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'diary',
        pathMatch: 'full'
      },
      {
        path: 'diary',
        loadComponent: () => import('./pages/diary/diary.component').then(m => m.DiaryComponent)
      } /*,
      {
        path: 'diary/:date',
        loadComponent: () => import('./pages/diary/diary.component').then(m => m.DiaryComponent)
      },
      {
        path: 'stats',
        loadComponent: () => import('./pages/stats/stats.component').then(m => m.StatsComponent)
      },
      {
        path: 'programs',
        loadComponent: () => import('./pages/programs/programs.component').then(m => m.ProgramsComponent)
      },
      {
        path: 'programs/create',
        loadComponent: () => import('./pages/create-program/create-program.component').then(m => m.CreateProgramComponent)
      },
      {
        path: 'programs/:id',
        loadComponent: () => import('./pages/program/program.component').then(m => m.ProgramComponent)
      },
      {
        path: 'programs/:id/edit',
        loadComponent: () => import('./pages/edit-program/edit-program.component').then(m => m.EditProgramComponent)
      },
      {
        path: 'friends',
        loadComponent: () => import('./pages/friends/friends.component').then(m => m.FriendsComponent)
      },
      {
        path: 'friends/:userid',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'friends/:userid/diary',
        loadComponent: () => import('./pages/friend-diary/friend-diary.component').then(m => m.FriendDiaryComponent)
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'messages/:userid',
        loadComponent: () => import('./pages/message/message.component').then(m => m.MessageComponent)
      },
      {
        path: 'bodyweight',
        loadComponent: () => import('./pages/bodyweight/bodyweight.component').then(m => m.BodyweightComponent)
      },
      {
        path: 'records',
        loadComponent: () => import('./pages/records/records.component').then(m => m.RecordsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'calculators',
        loadComponent: () => import('./pages/calculators/calculators.component').then(m => m.CalculatorsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent)
      },
      {
        path: 'premium',
        loadComponent: () => import('./pages/premium/premium.component').then(m => m.PremiumComponent)
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/help/help.component').then(m => m.HelpComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support.component').then(m => m.SupportComponent)
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy.component').then(m => m.PrivacyComponent)
      } */
    ]
  },
  {
    path: '**',
    redirectTo: 'diary'
  }
];
