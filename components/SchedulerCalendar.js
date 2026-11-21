import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function SchedulerCalendar(props) {
  return <FullCalendar {...props} plugins={[dayGridPlugin, interactionPlugin]} />
}
