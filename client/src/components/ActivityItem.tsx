import { ActivityFeedItem } from '../hooks/useActivityFeed';

interface ActivityItemProps {
  activity: ActivityFeedItem;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { actor, action, entityType, metadata, createdAt } = activity;

  const actorName = actor.name ?? actor.email;
  const parsedMetadata = metadata ? JSON.parse(metadata) : {};
  const entityName = parsedMetadata.entityName ?? '';

  let description = '';
  let icon = '';

  switch (action) {
    case 'CREATED':
      description = `created ${entityType} "${entityName}"`;
      icon = '➕';
      break;
    case 'UPDATED':
      description = `updated ${entityType} "${entityName}"`;
      icon = '✏️';
      break;
    case 'DELETED':
      description = `deleted ${entityType} "${entityName}"`;
      icon = '🗑️';
      break;
    case 'COMPLETED':
      description = `completed ${entityType} "${entityName}"`;
      icon = '✅';
      break;
    case 'ASSIGNED':
      description = `assigned ${entityType} "${entityName}" to ${parsedMetadata.assignedToName ?? 'someone'}`;
      icon = '👤';
      break;
    case 'COMMENTED':
      description = `commented on ${entityType} "${entityName}"`;
      icon = '💬';
      break;
    case 'MEMBER_ADDED':
      description = `added ${parsedMetadata.memberEmail ?? 'a member'} as ${parsedMetadata.memberRole ?? 'MEMBER'}`;
      icon = '👥';
      break;
    case 'MEMBER_REMOVED':
      description = `removed ${parsedMetadata.memberEmail ?? 'a member'}`;
      icon = '👥';
      break;
    case 'MEMBER_ROLE_CHANGED':
      description = `changed ${parsedMetadata.memberEmail ?? 'a member'}'s role from ${parsedMetadata.oldValue ?? ''} to ${parsedMetadata.newValue ?? ''}`;
      icon = '🔄';
      break;
    default:
      description = `performed ${action} on ${entityType}`;
      icon = '⚡';
  }

  const timeAgo = getTimeAgo(new Date(createdAt));

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{actorName}</span> {description}
        </p>
        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
