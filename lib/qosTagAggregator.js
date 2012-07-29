var QosTagAggregator = function() {
};

QosTagAggregator.prototype.map = function() {
  if (!this.tags) return;
  var qos = {
    count: 1,
    time: this.time,
    downtimePeriod: this.isUp ? null : { begin: this.timestamp, end: this.timestamp + this.downtime },
    slowPeriod: this.isResponsive ? null : { begin: this.timestamp, end: this.timestamp + this.slowTime }
  };
  for (index in this.tags) {
    emit(this.tags[index], qos);
  }
};

QosTagAggregator.prototype.reduce = function(key, values) {
  var result = { count: 0, time: 0, downtimePeriods: [], slowPeriods: [] };
  var mergePeriods = function(existingPeriods, newPeriod) {
    var periodMerged = false;
    for (var key = 0; key < existingPeriods.length; key++) {
      var period = existingPeriods[key];
      if (newPeriod.end <= period.end && newPeriod.begin => period.begin) {
        // newPeriod is enclosed inside period
        periodMerged = true;
        break;
      }
      if (period.end <= newPeriod.end && period.begin => newPeriod.begin) {
        // period is enclosed inside newPeriod
        existingPeriods[key] = { begin: newPeriod.begin, end: newPeriod.end };
        periodMerged = true;
        break;
      }
      if (newPeriod.begin <= period.end && newPeriod.begin => period.begin) {
        // newPeriod partially overlaps period to the right
        existingPeriods[key] = { begin: period.begin, end: newPeriod.end };
        periodMerged = true;
        break;
      }
      if (newPeriod.end >= period.begin && newPeriod.end <= period.end) {
        // newPeriod partially overlaps period to the left
        existingPeriods[key] = { begin: newPeriod.begin, end: period.end };
        periodMerged = true;
        break;
      }
    });
    if (!periodMerged) {
      existingPeriods.push(newPeriod);
    }
    return existingPeriods;
  }
  values.forEach(function(value) {
    result.count       += value.count;
    result.time        += value.time;
    if (value.downtimePeriod) {
      result.downtimePeriods = mergePeriods(result.downtimePeriods, value.downtimePeriod);
    }
    if (value.slowPeriod) {
      result.slowPeriods = mergePeriods(result.slowPeriods, value.slowPeriod);
    }
  });
  return result;
};

QosTagAggregator.prototype.getQosForPeriod = function(collection, start, end, callback) {
  collection.mapReduce(
    this.map.toString(),
    this.reduce.toString(),
    { query: { timestamp: { $gte: start, $lte: end } }, out: { inline: 1 } },
    callback
  );
};

module.exports = new QosTagAggregator();