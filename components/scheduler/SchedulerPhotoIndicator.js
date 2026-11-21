import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded"

export default function SchedulerPhotoIndicator({ count }) {
  if (!count) return null
  const label = `${count} photo${count === 1 ? "" : "s"}`
  return <span role="img" aria-label={label} title={label} style={{ display: "inline-flex", verticalAlign: "middle", flexShrink: 0, marginRight: 4 }}><PhotoLibraryRoundedIcon aria-hidden="true" style={{ fontSize: 16 }} /></span>
}
