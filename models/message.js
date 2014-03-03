exports.new = function() {
  return {
    id          : utils.GUID(10),
    content     : null,
    updated_at  : null,
    sender      : 'not specified',
    direction   : 'in',
    type        : 'none',
    received    : new Date()
  }
}

