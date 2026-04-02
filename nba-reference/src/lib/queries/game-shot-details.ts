export interface ShotEvent {
  event_id: string;
  period: number;
  pc_time_string: string | null;
  home_description: string | null;
  visitor_description: string | null;
  score: string | null;
  eventmsgtype: number;
  player_name: string | null;
  team: string | null;
  shot_result: 'made' | 'missed';
  shot_type: string | null;
  shot_distance: number | null;
  shot_zone: string | null;
  assisted: boolean;
  shot_value: 2 | 3 | null;
}

export function parseShotDescription(
  description: string,
  eventmsgtype: number
): Pick<
  ShotEvent,
  'shot_type' | 'shot_distance' | 'shot_zone' | 'assisted' | 'shot_value' | 'shot_result'
> {
  if (description.trim() === '') {
    return {
      shot_type: null,
      shot_distance: null,
      shot_zone: null,
      assisted: false,
      shot_value: null,
      shot_result: eventmsgtype === 1 ? 'made' : 'missed',
    };
  }

  const is3pt = description.includes('3PT');
  const distanceExec = /(\d+)'/.exec(description);
  const shotDistance = distanceExec?.[1] != null ? parseInt(distanceExec[1], 10) : null;
  const assisted = /\d+\s+AST\)|AST\)/.test(description);

  let shotType: string | null;
  if (is3pt) {
    shotType = '3-Point';
  } else if (/dunk/i.test(description)) {
    shotType = 'Dunk';
  } else if (/alley.?oop/i.test(description)) {
    shotType = 'Alley Oop';
  } else if (/layup/i.test(description)) {
    shotType = 'Layup';
  } else if (/hook/i.test(description)) {
    shotType = 'Hook Shot';
  } else if (/tip/i.test(description)) {
    shotType = 'Tip Shot';
  } else if (/floater/i.test(description)) {
    shotType = 'Floater';
  } else if (/pull.?up/i.test(description)) {
    shotType = 'Pull-Up Jump Shot';
  } else if (/step.?back/i.test(description)) {
    shotType = 'Step-Back Jump Shot';
  } else if (/fadeaway/i.test(description)) {
    shotType = 'Fadeaway';
  } else if (/jump/i.test(description)) {
    shotType = 'Jump Shot';
  } else {
    shotType = 'Field Goal';
  }

  let shotZone: string | null;
  if (is3pt) {
    shotZone = shotDistance !== null && shotDistance <= 22 ? 'Corner 3' : 'Above Break 3';
  } else if (
    /dunk|alley.?oop/i.test(description) ||
    shotType === 'Layup' ||
    (shotDistance !== null && shotDistance <= 4)
  ) {
    shotZone = 'Restricted Area';
  } else if (shotDistance !== null && shotDistance <= 8) {
    shotZone = 'In The Paint';
  } else if (shotDistance !== null && shotDistance <= 16) {
    shotZone = 'Mid-Range';
  } else if (shotDistance !== null) {
    shotZone = 'Long 2';
  } else {
    shotZone = null;
  }

  return {
    shot_type: shotType,
    shot_distance: shotDistance,
    shot_zone: shotZone,
    assisted,
    shot_value: is3pt ? 3 : 2,
    shot_result: eventmsgtype === 1 ? 'made' : 'missed',
  };
}
