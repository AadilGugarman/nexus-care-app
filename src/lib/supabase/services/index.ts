// Services Index - Export all services for easy importing

export { DoctorsService } from './doctors.service';
export { RoutesService } from './routes.service';
export { VisitsService } from './visits.service';
export { AssignmentsService } from './assignments.service';
export { SettingsService } from './settings.service';
export { AnalyticsService } from './analytics.service';
export { DirectoryService } from './directory.service';
export { NotificationsService } from './notifications.service';
export { UserManagementService } from './user-management.service';

export type {
  MRStatistics,
  SystemStatistics,
  DoctorUsageStatistics,
  RouteAnalytics
} from './analytics.service';

export type {
  PublicDoctor,
  DirectoryFilters,
  DirectoryAnalytics,
  MostViewedDoctor
} from './directory.service';

export type {
  Notification,
  NotificationFilters
} from './notifications.service';

export type {
  UserProfile,
  UserActivityStats,
  UserStatus,
  UserRole,
  UpdateUserData
} from './user-management.service';
