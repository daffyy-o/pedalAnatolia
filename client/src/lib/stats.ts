import { AppUser } from '../store/users';
import { SchoolZoneFeature } from './schoolZones';
import { LocationComment } from '../store/locationComments';

export function getHiddenCounters(
  users: AppUser[],
  schoolZones: SchoolZoneFeature[],
  comments: LocationComment[]
) {
  return {
    schoolZones: schoolZones.length,
    users: users.filter((u) => u.role === 'user').length,
    admins: users.filter((u) => u.role === 'admin').length,
    comments: comments.length,
  };
}

