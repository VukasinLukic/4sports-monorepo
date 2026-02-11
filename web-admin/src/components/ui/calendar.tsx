import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className = '', classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={className}
      classNames={{
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
