import dayjs from 'dayjs'

export function orderno(id) {
  return (
    '#' +
    String(id || '')
      .slice(-6)
      .toUpperCase()
  )
}

export function money(n) {
  return 'Rs ' + Number(n).toLocaleString()
}

export function PrettyDate(iso) {
  if (!iso) {
    return ''
  }
  return dayjs(iso).format('ddd, MMM D, YYYY [at] h:mm A')
}

export function ShortDate(iso) {
  if (!iso) {
    return ''
  }
  return dayjs(iso).format('MMM D, YYYY')
}

export function readfiles(fileList) {
  const list = []
  for (let i = 0; i < fileList.length; i++) {
    list.push(
      new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(fileList[i])
      }),
    )
  }
  return Promise.all(list)
}
