module.exports = (msg, wait, error, date, zip, avg, uptime) => {
  let header = [
    { type: 'text', text: 'Inbound Transfer', color: '#333333', size: 'md', weight: 'bold' },
    { type: 'text', margin: 'xs', text: '(', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 }
  ]

  if (!error && !wait) {
    header.push({ type: 'text', margin: 'xs', text: 'OK', color: '#4caf50', size: 'xxs', weight: 'bold', flex: 0 })
  } else {
    if (error) {
      header.push({ type: 'text', margin: 'xs', text: 'FAIL', color: '#F44336', size: 'xxs', weight: 'bold', flex: 0 })
      header.push({ type: 'text', margin: 'xs', text: String(error), color: '#F44336', weight: 'bold', size: 'xxs', flex: 0 })
    }
    if (error && wait) {
      header.push({ type: 'text', margin: 'xs', text: ',', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 })
    }
    if (wait) {
      header.push({ type: 'text', margin: 'xs', text: 'WAIT', color: '#FF9800', size: 'xxs', weight: 'bold', flex: 0 })
      header.push({ type: 'text', margin: 'xs', text: String(wait), color: '#FF9800', weight: 'bold', size: 'xxs', flex: 0 })
    }
  }
  header.push({ type: 'text', margin: 'xs', text: ')', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 })

  let flexMessage = {
    type: 'bubble',
    styles: { body: { backgroundColor: '#F7F7F7' } },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'box', margin: 'sm', layout: 'baseline', contents: header },
        {
          type: 'box',
          margin: 'sm',
          layout: 'horizontal',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: 'ZIP', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'total', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(zip), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'files', color: '#969696', margin: 'sm', size: 'xxs' }
                  ]
                }
              ]
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: 'Unzip', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'avg.', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(avg), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'seconds', color: '#969696', margin: 'sm', size: 'xxs' }
                  ]
                }
              ]
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: 'Uptime', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'usage', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(uptime), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'hours', color: '#969696', margin: 'sm', size: 'xxs' }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'box',
          margin: 'md',
          layout: 'baseline',
          contents: [
            { type: 'text', text: `latest upzip ${date}`, color: '#a3a3a3', size: 'xxs' }
          ]
        }
      ]
    }
  }

  return {
    type: 'flex',
    altText: msg,
    contents: flexMessage
  }
}