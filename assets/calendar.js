function groupShowsByDate(shows) {
  const grouped = {}

  shows.forEach(show => {
    if (!grouped[show.data]) {
      grouped[show.data] = []
    }
    grouped[show.data].push(show)
  })

  return grouped
}
