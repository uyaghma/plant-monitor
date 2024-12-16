const mqtt = require("mqtt");

const options = {
  port: process.env.BROKER_PORT,
  host: process.env.BROKER_ADDR,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  protocol: "mqtts",
};

const mqttClient = mqtt.connect(options);

mqttClient.on("error", (error) => {
  console.error("MQTT Connection Error: ", error);
});

module.exports = mqttClient;
