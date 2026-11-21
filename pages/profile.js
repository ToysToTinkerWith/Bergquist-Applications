export default function ProfileUnavailable() {
  return null
}

export async function getServerSideProps() {
  return { redirect: { destination: "/", permanent: false } }
}
