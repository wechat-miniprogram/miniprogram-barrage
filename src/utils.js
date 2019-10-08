// 获取字节长度，中文算2个字节
function getStrLen(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[^\x00-\xff]/g, 'aa').length
}

// 截取指定字节长度的子串
function substring(str, n) {
  if (!str) return ''

  const len = getStrLen(str)
  if (n >= len) return str

  let l = 0
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str.charAt(i)
    // eslint-disable-next-line no-control-regex
    l = /[^\x00-\xff]/i.test(ch) ? l + 2 : l + 1
    result += ch
    if (l >= n) break
  }
  return result
}

function getRandom(max = 10, min = 0) {
  return Math.floor(Math.random() * (max - min) + min)
}

function getFontSize(font) {
  const reg = /(\d+)(px)/i
  const match = font.match(reg)
  return (match && match[1]) || 10
}


module.exports = {
  getStrLen,
  substring,
  getRandom,
  getFontSize
}
