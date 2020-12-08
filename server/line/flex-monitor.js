const moment = require('moment')

const statusColor = (e) => {
  switch (e) {
    case 'INFO':
      return '#17a2b8'
    case 'WARN':
      return '#ffc107'
    case 'FAIL':
      return '#dc3545'
    case 'PASS':
      return '#1DB446'
    default:
      return '#CCCCCC'
  }
}

module.exports = (name, tasks, updated = false) => {
  const totalFail = tasks.filter((e) => e.status === 'FAIL').length
  const totalWarn = tasks.filter((e) => e.status === 'WARN').length
  const totalInfo = tasks.filter((e) => e.status === 'INFO').length

  const topName = `Monitor DailyClose`
  const topStatus = updated
    ? 'UPDATE'
    : totalFail > 0
    ? 'FAIL'
    : totalWarn > 0
    ? 'WARN'
    : totalInfo > 0
    ? 'INFO'
    : 'PASS'
  const topColor = statusColor(topStatus)
  const topDate = moment().format('HH:mm, DD MMM YYYY')

  tasks = tasks.map((e) => {
    const text = !e.problem ? 'PASS' : e.status
    const color = statusColor(text)
    const contents = [
      {
        type: 'box',
        layout: 'baseline',
        contents: [
          {
            type: 'text',
            text: e.sSubject,
            color: '#333333',
            weight: 'bold',
            size: 'xxs',
            flex: 12,
          },
          {
            type: 'text',
            text,
            color,
            weight: 'bold',
            size: 'xxs',
            align: 'end',
            flex: 2,
          },
        ],
      },
    ]
    if (e.problem) {
      contents.push({
        type: 'box',
        layout: 'baseline',
        contents: [
          { type: 'text', text: ' ', flex: 1 },
          {
            type: 'text',
            text: e.reason,
            wrap: true,
            color: '#999999',
            weight: 'bold',
            size: 'xxs',
            flex: 24,
          },
        ],
      })
    }
    return contents
  })
  if (updated)
    tasks.push({
      type: 'button',
      action: { type: 'uri', label: 'View History', uri: updated },
    })
  const flexMessage = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `[${topStatus}]`,
              weight: 'bold',
              color: topColor,
              size: 'sm',
              flex: 0,
            },
            { type: 'text', text: '-', color: '#FFFFFF', flex: 0 },
            { type: 'text', text: topName, weight: 'bold', size: 'sm' },
          ],
        },
        { type: 'separator', margin: 'sm' },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'sm',
          spacing: 'xs',
          contents: [].concat(...tasks),
        },
        { type: 'separator', margin: 'sm' },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            { type: 'text', text: topDate, color: '#666666', size: 'xxs' },
            {
              type: 'text',
              text: name,
              color: '#aaaaaa',
              size: 'xxs',
              align: 'end',
            },
          ],
        },
      ],
    },
  }

  return {
    type: 'flex',
    altText: `[${topStatus}] ${topName} at ${topDate} by ${name}`,
    contents: flexMessage,
  }
}
