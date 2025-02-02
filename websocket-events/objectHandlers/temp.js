const variables = require('../../utils/variablesUtil')

module.exports = (data, connection, discordClient, database) => {
  if(!/(temp)/g.test(JSON.stringify(data))) { return }
  loopTempSensors(data)
}

function loopTempSensors(data) {
    Object.keys(data).forEach(tempSensor => {
      if (typeof(data[tempSensor].temperature) !== 'undefined') {
            updateTempSensor(tempSensor, data[tempSensor])
      }
    })
}

function updateTempSensor(tempSensor, data) {
    if(typeof(variables.getTemperatures()[tempSensor]) === 'undefined') {
        variables.setTemperature(tempSensor, data)
        return
    }

    const oldTempData = variables.getTemperatures()[tempSensor]

    for(const index in data) {
      oldTempData[index] = data[index]
    }

    variables.setTemperature(tempSensor, oldTempData)
}