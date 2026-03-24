declare module 'react-big-calendar' {
  import * as React from 'react';

  export interface Event {
    id?: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    [key: string]: any;
  }

  export interface CalendarProps {
    events: Event[];
    views?: any;
    view?: string;
    onView?: (view: string) => void;
    localizer: any;
    startAccessor?: string;
    endAccessor?: string;
    style?: React.CSSProperties;
    onSelectEvent?: (event: Event) => void;
    messages?: any;
    eventPropGetter?: (event: Event) => any;
    components?: any;
  }

  export function momentLocalizer(moment: any): any;

  export const Calendar: React.FC<CalendarProps>;
}

declare module 'react-big-calendar/lib/css/react-big-calendar.css' {
  const content: string;
  export default content;
}
