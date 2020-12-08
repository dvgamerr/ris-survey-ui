const logger = require('@touno-io/debuger')('SERVER')
const moment = require('moment')
const LINE = require('../../line')

module.exports = async (req, res) => {
  const { color, name, desc } = req.params
  try {
    const body = {
      type: 'flex',
      altText: `${name} ${desc}`,
      contents: {
        type: 'bubble',
        styles: { body: { backgroundColor: '#f3f3f3' } },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              weight: 'bold',
              text: name,
              size: 'sm',
              color: '#000000',
            },
            {
              type: 'text',
              weight: 'bold',
              text: desc,
              size: 'xxs',
              color: `#${color}`,
            },
            {
              type: 'text',
              margin: 'md',
              text: moment().format('YYYY-MM-DD HH:mm:ss'),
              size: 'xxs',
              color: '#a3a3a3',
            },
          ],
        },
      },
    }
    await LINE(body, 'ris-sd3', 'C31ca657c0955d89dcb049d63bfc32408')
  } catch (ex) {
    logger.error(ex)
  } finally {
    res.end()
  }
}
