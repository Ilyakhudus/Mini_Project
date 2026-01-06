export const formatDate = (dateString) => {
  if (!dateString) return ""

  // If dateString is ISO format YYYY-MM-DD, parse it directly without timezone conversion
  if (typeof dateString === "string" && dateString.includes("-")) {
    const [year, month, day] = dateString.split("T")[0].split("-")
    return `${day}/${month}/${year}`
  }

  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const formatDateLong = (dateString) => {
  if (!dateString) return ""

  // If dateString is ISO format YYYY-MM-DD, parse it directly without timezone conversion
  if (typeof dateString === "string" && dateString.includes("-")) {
    const [year, month, day] = dateString.split("T")[0].split("-")
    return `${day}/${month}/${year}`
  }

  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
