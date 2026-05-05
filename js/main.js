import { Container } from './core/Container.js';
import { EventBus } from './core/EventBus.js';
import { Router } from './core/Router.js';
import { LocalStorageRepo } from './repositories/LocalStorageRepo.js';
import { FinanceService } from './services/FinanceService.js';
import { FinanceView } from './views/FinanceView.js';
import { RoutineService } from './services/RoutineService.js';
import { RoutineView } from './views/RoutineView.js';
import { RouteService } from './services/RouteService.js';
import { RouteView } from './views/RouteView.js';
import { HabitService } from './services/HabitService.js';
import { HabitView } from './views/HabitView.js';
import { ReviewService } from './services/ReviewService.js';
import { ReviewView } from './views/ReviewView.js';
import { DashboardView } from './views/DashboardView.js';
import { CalendarService } from './services/CalendarService.js';
import { CalendarView } from './views/CalendarView.js';
import { ProfileService } from './services/ProfileService.js';
import { ProfileView } from './views/ProfileView.js';
import { AIService } from './services/AIService.js';
import { AIAssistantView } from './views/AIAssistantView.js';
import { BackupService } from './services/BackupService.js';

// Setup DI Container
const container = new Container();

// Infrastructure
container.register('EventBus', () => new EventBus());
container.register('Router', (c) => new Router(c, 'app-content'));
container.register('Repository', () => new LocalStorageRepo());

// Services
container.register('FinanceService', (c) => new FinanceService(
  c.resolve('Repository'),
  c.resolve('EventBus')
));
container.register('RoutineService', (c) => new RoutineService(c.resolve('Repository')));
container.register('RouteService', (c) => new RouteService(c.resolve('Repository')));
container.register('HabitService', (c) => new HabitService(c.resolve('Repository')));
container.register('ReviewService', (c) => new ReviewService(c.resolve('Repository')));
container.register('CalendarService', (c) => new CalendarService(c.resolve('Repository'), c.resolve('EventBus')));
container.register('ProfileService', (c) => new ProfileService(c.resolve('Repository')));
container.register('AIService', (c) => new AIService(
  c.resolve('FinanceService'),
  c.resolve('HabitService'),
  c.resolve('ReviewService'),
  c.resolve('RoutineService'),
  c.resolve('CalendarService'),
  c.resolve('RouteService'),
  c.resolve('ProfileService')
));
container.register('BackupService', (c) => new BackupService());

// Views
container.register('DashboardView', (c) => new DashboardView(
  c.resolve('FinanceService'),
  c.resolve('RoutineService'),
  c.resolve('HabitService')
), { singleton: false });
container.register('FinanceView', (c) => new FinanceView(
  c.resolve('FinanceService'),
  c.resolve('EventBus')
), { singleton: false });
container.register('RoutineView', (c) => new RoutineView(
  c.resolve('RoutineService'),
  c.resolve('AIService'),
  c.resolve('HabitService')
), { singleton: false });
container.register('RouteView', (c) => new RouteView(c.resolve('RouteService')), { singleton: false });
container.register('HabitView', (c) => new HabitView(c.resolve('HabitService')), { singleton: false });
container.register('ReviewView', (c) => new ReviewView(c.resolve('ReviewService')), { singleton: false });
container.register('CalendarView', (c) => new CalendarView(c.resolve('CalendarService'), c.resolve('EventBus')), { singleton: false });
container.register('ProfileView', (c) => new ProfileView(
  c.resolve('ProfileService'),
  c.resolve('BackupService')
), { singleton: false });
container.register('AIAssistantView', (c) => new AIAssistantView(c.resolve('AIService')), { singleton: false });

// Start App
document.addEventListener('DOMContentLoaded', () => {
  const router = container.resolve('Router');
  
  // Register routes
  router.register('dashboard', 'DashboardView');
  router.register('finance', 'FinanceView');
  router.register('calendar', 'CalendarView');
  router.register('routine', 'RoutineView');
  router.register('routes', 'RouteView');
  router.register('habits', 'HabitView');
  router.register('review', 'ReviewView');
  router.register('profile', 'ProfileView');
  router.register('ai', 'AIAssistantView');
  
  // Update nav active state
  window.addEventListener('hashchange', () => {
    const hash = location.hash || '#dashboard';
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
  });
  
  router.start();
});
