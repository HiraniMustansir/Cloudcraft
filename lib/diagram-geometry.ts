export type DiagramRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DiagramPoint = { x: number; y: number };

export type ConnectionRouting = 'elbow' | 'curved' | 'straight';

type ConnectionGeometry = {
  path: string;
  labelX: number;
  labelY: number;
};

const edges = (rect: DiagramRect) => ({
  left: rect.x - rect.w / 2,
  right: rect.x + rect.w / 2,
  top: rect.y - rect.h / 2,
  bottom: rect.y + rect.h / 2,
});

const contains = (outer: DiagramRect, inner: DiagramRect) => {
  const a = edges(outer);
  const b = edges(inner);
  return (
    b.left >= a.left &&
    b.right <= a.right &&
    b.top >= a.top &&
    b.bottom <= a.bottom
  );
};

const boundaryPoint = (rect: DiagramRect, target: DiagramPoint) => {
  const dx = target.x - rect.x;
  const dy = target.y - rect.y;
  if (!dx && !dy) return { x: rect.x, y: rect.y };
  const scale = Math.min(
    Math.abs(rect.w / 2 / (dx || 0.0001)),
    Math.abs(rect.h / 2 / (dy || 0.0001)),
  );
  return { x: rect.x + dx * scale, y: rect.y + dy * scale };
};

const nearestContainmentAnchors = (
  outer: DiagramRect,
  inner: DiagramRect,
): { outer: DiagramPoint; inner: DiagramPoint } => {
  const a = edges(outer);
  const b = edges(inner);
  const gaps = [
    { side: 'left', value: b.left - a.left },
    { side: 'right', value: a.right - b.right },
    { side: 'top', value: b.top - a.top },
    { side: 'bottom', value: a.bottom - b.bottom },
  ].sort((first, second) => first.value - second.value);

  switch (gaps[0].side) {
    case 'left':
      return {
        outer: { x: a.left, y: inner.y },
        inner: { x: b.left, y: inner.y },
      };
    case 'right':
      return {
        outer: { x: a.right, y: inner.y },
        inner: { x: b.right, y: inner.y },
      };
    case 'top':
      return {
        outer: { x: inner.x, y: a.top },
        inner: { x: inner.x, y: b.top },
      };
    default:
      return {
        outer: { x: inner.x, y: a.bottom },
        inner: { x: inner.x, y: b.bottom },
      };
  }
};

const roundedPath = (points: DiagramPoint[], radius = 9) => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incomingLength = Math.hypot(
      current.x - previous.x,
      current.y - previous.y,
    );
    const outgoingLength = Math.hypot(next.x - current.x, next.y - current.y);
    const bend = Math.min(radius, incomingLength / 2, outgoingLength / 2);

    if (bend < 0.5) {
      path += ` L ${current.x} ${current.y}`;
      continue;
    }

    const before = {
      x: current.x - ((current.x - previous.x) / incomingLength) * bend,
      y: current.y - ((current.y - previous.y) / incomingLength) * bend,
    };
    const after = {
      x: current.x + ((next.x - current.x) / outgoingLength) * bend,
      y: current.y + ((next.y - current.y) / outgoingLength) * bend,
    };
    path += ` L ${before.x} ${before.y} Q ${current.x} ${current.y} ${after.x} ${after.y}`;
  }

  const last = points.at(-1)!;
  return `${path} L ${last.x} ${last.y}`;
};

const labelOnLongestSegment = (points: DiagramPoint[]) => {
  let longest = { from: points[0], to: points[1], length: 0 };
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length > longest.length) longest = { from, to, length };
  }
  return {
    labelX: (longest.from.x + longest.to.x) / 2,
    labelY: (longest.from.y + longest.to.y) / 2 - 8,
  };
};

const orthogonalPoints = (from: DiagramRect, to: DiagramRect) => {
  if (contains(from, to)) {
    const anchors = nearestContainmentAnchors(from, to);
    return [anchors.outer, anchors.inner];
  }
  if (contains(to, from)) {
    const anchors = nearestContainmentAnchors(to, from);
    return [anchors.inner, anchors.outer];
  }

  const normalizedX = Math.abs(to.x - from.x) / ((from.w + to.w) / 2);
  const normalizedY = Math.abs(to.y - from.y) / ((from.h + to.h) / 2);
  const horizontal = normalizedX >= normalizedY;

  if (horizontal) {
    const direction = to.x >= from.x ? 1 : -1;
    const start = { x: from.x + direction * (from.w / 2), y: from.y };
    const end = { x: to.x - direction * (to.w / 2), y: to.y };
    if (Math.abs(start.y - end.y) < 1) return [start, end];
    const middleX = (start.x + end.x) / 2;
    return [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end];
  }

  const direction = to.y >= from.y ? 1 : -1;
  const start = { x: from.x, y: from.y + direction * (from.h / 2) };
  const end = { x: to.x, y: to.y - direction * (to.h / 2) };
  if (Math.abs(start.x - end.x) < 1) return [start, end];
  const middleY = (start.y + end.y) / 2;
  return [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end];
};

export function getConnectionGeometry(
  from: DiagramRect,
  to: DiagramRect,
  routing: ConnectionRouting = 'elbow',
): ConnectionGeometry {
  if (routing === 'straight') {
    const start = boundaryPoint(from, to);
    const end = boundaryPoint(to, from);
    const points = [start, end];
    return { path: roundedPath(points), ...labelOnLongestSegment(points) };
  }

  if (routing === 'curved') {
    const start = boundaryPoint(from, to);
    const end = boundaryPoint(to, from);
    const midX = (start.x + end.x) / 2;
    return {
      path: `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`,
      labelX: midX,
      labelY: (start.y + end.y) / 2 - 8,
    };
  }

  const points = orthogonalPoints(from, to);
  return { path: roundedPath(points), ...labelOnLongestSegment(points) };
}
