module.exports = (msg, usage, task, mSuccess, max, sales, tSuccess) => {

  let flexMessage = {
    type: 'bubble',
    styles: { body: { backgroundColor: '#F7F7F7' } },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: 'The1 Card POSDB-Staging', color: '#333333', size: 'md', weight: 'bold' },
        {
          type: 'box',
          margin: 'sm',
          layout: 'baseline',
          contents: [
            { type: 'text', text: 'Staging Master', color: '#333333', size: 'sm', weight: 'bold' },
            { type: 'text', margin: 'xs', text: '(', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 },
            { type: 'text', margin: 'xs', text: mSuccess ? 'OK' : 'WARN', color: mSuccess ? '#4caf50' : '#FF9800', size: 'xxs', weight: 'bold', flex: 0 },
            { type: 'text', margin: 'xs', text: ')', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 }
          ]
        },
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
                    { type: 'text', text: 'Job', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'list', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(task), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'rows', color: '#969696', margin: 'sm', size: 'xxs' }
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
                    { type: 'text', text: 'Usage', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'jobs.', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(usage), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'mins', color: '#969696', margin: 'sm', size: 'xxs' }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'box',
          margin: 'sm',
          layout: 'baseline',
          contents: [
            { type: 'text', text: 'Staging Transection', color: '#333333', size: 'sm', weight: 'bold' },
            { type: 'text', margin: 'xs', text: '(', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 },
            { type: 'text', margin: 'xs', text: tSuccess === 0 ? 'OK' : 'WARN ' + tSuccess, color: tSuccess === 0 ? '#4caf50' : '#FF9800', size: 'xxs', weight: 'bold', flex: 0 },
            { type: 'text', margin: 'xs', text: ')', color: '#333333', size: 'xxs', weight: 'bold', flex: 0 }
          ]
        },
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
                    { type: 'text', text: 'TTHSale', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'daily', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(sales), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'rows', color: '#969696', margin: 'sm', size: 'xxs' }
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
                    { type: 'text', text: 'Usage', color: '#363636', weight: 'bold', size: 'xxs', flex: 0 },
                    { type: 'text', text: 'avg.', margin: 'sm', color: '#666666', size: 'xxs' }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: String(max), color: '#363636', size: 'xxs', weight: 'bold', flex: 0 },
                    { type: 'text', text: 'mins.', color: '#969696', margin: 'sm', size: 'xxs' }
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
            {
              type: 'text',
              text: 'latest job 2019-06-04 04:50:21',
              color: '#a3a3a3',
              size: 'xxs'
            }
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