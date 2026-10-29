export type ActivityType = 'created' | 'updated' | 'status_changed' | 'completed' | 'deleted';

export interface Activity {
  id: string;
  type: ActivityType;
  taskId: string;
  taskTitle: string;
  actor: string;
  timestamp: string;
  /** Optional human readable detail, e.g. "To Do → In Progress". */
  detail?: string;
}
