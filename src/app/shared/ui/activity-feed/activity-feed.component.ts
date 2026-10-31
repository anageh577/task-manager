import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Activity, ActivityType } from '@core/models';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const ACTIVITY_META: Record<ActivityType, { icon: string; verb: string }> = {
  created: { icon: '🆕', verb: 'created' },
  updated: { icon: '✏️', verb: 'updated' },
  status_changed: { icon: '🔀', verb: 'moved' },
  completed: { icon: '✅', verb: 'completed' },
  deleted: { icon: '🗑️', verb: 'deleted' },
};

@Component({
  selector: 'app-activity-feed',
  imports: [EmptyStateComponent, RelativeTimePipe, SkeletonComponent],
  template: `
    @if (loading()) {
      <div class="skeleton" aria-busy="true" aria-label="Loading activity">
        @for (i of [1, 2, 3, 4]; track i) {
          <app-skeleton height="34px" />
        }
      </div>
    } @else {
      <ol aria-live="polite">
        @for (activity of activities(); track activity.id) {
          <li animate.enter="tm-enter">
            <span class="icon" aria-hidden="true">{{ meta[activity.type].icon }}</span>
            <div class="text">
              <p>
                <strong>{{ activity.actor }}</strong> {{ meta[activity.type].verb }}
                <span class="task">“{{ activity.taskTitle }}”</span>
                @if (activity.detail) {
                  <span class="detail">({{ activity.detail }})</span>
                }
              </p>
              <time [attr.datetime]="activity.timestamp">{{
                activity.timestamp | relativeTime: now()
              }}</time>
            </div>
          </li>
        } @empty {
          <app-empty-state icon="🕒" title="No recent activity" />
        }
      </ol>
    }
  `,
  styles: `
    ol {
      display: flex;
      flex-direction: column;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    li {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--tm-border);
      &:last-child {
        border-bottom: 0;
      }
    }
    .icon {
      flex: none;
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      font-size: 14px;
      border-radius: 50%;
      background: var(--tm-surface-muted);
    }
    .text {
      min-width: 0;
      font-size: 13px;
    }
    .task {
      font-weight: 500;
    }
    .detail,
    time {
      font-size: 12px;
      color: var(--tm-text-muted);
    }
    .skeleton {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent {
  readonly activities = input.required<Activity[]>();
  readonly loading = input(false);
  readonly now = input<Date>(new Date());
  protected readonly meta = ACTIVITY_META;
}
