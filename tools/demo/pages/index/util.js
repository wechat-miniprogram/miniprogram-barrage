const msgs = [
  '666666',
  '我要上电视！！',
  '老板晚上好',
  '前方高能预警',
  '主播迟到了~~~',
  '干的漂亮',
  '早',
  '广东人民发来贺电',
  '不爱看的走开，别说话wen我'
]

const color = ['red', 'rgb(0, 255, 0)', '#0000FF', '#fff']

const getRandom = (max = 10, min = 0) => Math.floor(Math.random() * (max - min) + min)
const mockData = (num) => {
  const data = []
  for (let i = 0; i < num; i++) {
    const msgId = getRandom(msgs.length)
    const colorId = getRandom(color.length)
    data.push({
      content: msgs[msgId],
      color: color[colorId]
    })
  }
  return data
}

module.exports = {
  mockData
}
