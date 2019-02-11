// sudo chmod a+rw /dev/ttyUSB0
// arduino path /home/<username>/.local/share/umake/ide/arduino
//umake ide arduino
var five = require("johnny-five"), board, button;
const mesg = require('mesg-js').application();
board = new five.Board();


// actually you will send transaction to yourself

/// !! DON'T SHOW YOUR SEED TO ANYBODY !!!
const sensorMiliseconds = 10000; // write miliseconds how often to check temperature, humidity and pressure
const email = ''; // YOUR EMAIL
const iotaAddress = ''; // insert address and seed of iota account to which you will send data 
const iotaSeed = '';
const SEND_GRI_API_KEY = ''; // API TO SEND EMAIL
const uuid = '123'; // JUST RANDOM STRING, uuid needs to divide you future projects
const lessThanSecond = 24 * 3600; // HOW OFTEN YOU CAN GET NOTIFICATIONS

// YOU NEED TAG TO READ DATA FROM IOTA BLOCKCHAIN AND FIND DATA YOU NEED
const temperatureTag = 'TEMP';
const humidityTag = 'HUMIDITY';
const pressureTag = 'PRESSURE';

const buttonPin = 2; // WHERE YOU INSERT YOUR BUTTON 
const timeNow = Date.now() / 1000;
// console.log(timeNow);

board.on("ready", function() {

  button = new five.Button(buttonPin);

  // Inject the `button` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    button: button
  });

  // IF YOU GET ERROR, TRY TO REPLACE I2C ADDRESS OF SENSORS
  var multi = new five.Multi({
    controller: "BME280",
     address   : 0x76,
  });

  // WRITE DATA TO IOTA BLOCKCHAIN (TANGLE) 
  setInterval(() => 
    {
      // console.log(multi.thermometer.celsius);
      // console.log(multi.barometer.pressure);
      // console.log(multi.hygrometer.relativeHumidity);
      mesg.executeTask({
        serviceID: 'iota_client',
        taskKey : 'sendMessage',
        inputData : JSON.stringify({
          address : iotaAddress,
          message : `${multi.thermometer.celsius}`,
          tag: temperatureTag + uuid
        })
      }),
      mesg.executeTask({
        serviceID: 'iota_client',
        taskKey : 'sendMessage',
        inputData : JSON.stringify({
          address : iotaAddress,
          message : `${multi.barometer.pressure}`,
          tag: pressureTag + uuid
        })
      }),
      mesg.executeTask({
        serviceID: 'iota_client',
        taskKey : 'sendMessage',
        inputData : JSON.stringify({
          address : iotaAddress,
          message : `${multi.hygrometer.relativeHumidity}`,
          tag:  humidityTag + uuid
        })
      })
    }, sensorMiliseconds);


  //// READ DATA FROM BLOCKCHAIN AND SEND STATISTICS TO EMAIL
  setTimeout(() => {
    console.log('read data from TANGLE ');
    mesg.executeTaskAndWaitResult({
      serviceID: 'iota_client',
      taskKey : 'readMessage',
      inputData : JSON.stringify({
          seed : iotaSeed,
          tag: temperatureTag + uuid
      })
    })
      .then(transactionsArr => { 
        let transArr = JSON.parse(transactionsArr.outputData).transactionMessages
        // console.log(transArr)
        var sum = 0;
        for( var i = 0; i < transArr.length; i++ ){
          // if temistamp is less than 24 hours
          console.log(transArr[i].timestamp);
          if ((transArr[i].timestamp - timeNow) < (lessThanSecond)) {
            sum += parseFloat( transArr[i].text); //don't forget to add the base
          }
        } 
        var avg = sum/transArr.length;

        // send email with avarage temperature per day
        console.log('sendEmail');
        mesg.executeTask({
          serviceID: 'email_sending',
          taskKey: "send",
          inputData:  JSON.stringify({
            email,
            subject : 'Avarage temperature',
            messageBody : 'Today avarage temperature was - ' + avg,
            sendgridAPIKey : SEND_GRI_API_KEY
          })
        })
      })
  }, 10000)



  // "down" the button is pressed
  button.on("down", function() {
    console.log("down");
    mesg.executeTask({
      serviceID: "email_sending",
      taskKey: "send",
      inputData : JSON.stringify({
          email,
          subject: 'button is pressed',
          messageBody : 'hi, button is clicked',
          sendgridAPIKey : SEND_GRI_API_KEY
      })
    })
  });



  // YOU CAN UNCOMMENT THIS LINES ADD MORE FUNCTIONS

  // "hold" the button is pressed for specified time.
  //        defaults to 500ms (1/2 second)
  //        set
  // button.on("hold", function() {
  //   console.log("hold");
  // });

  // // "up" the button is released
  // button.on("up", function() {
  //   console.log("up");
  // });


  // FOR ANOTHER SENSOR

  // var proximity = new five.Proximity({
  //   controller: "HCSR04",
  //   pin: "A0",
  //   // freq: 250
  // });
  // proximity.on("data", function() {
  //   console.log("Proximity: ");
  //   console.log("  cm  : ", this.cm);
  //   console.log("  in  : ", this.in);
  //   console.log("-----------------");
  // });
  // proximity.on("change", function() {
  //   console.log("The obstruction has moved.");
  // });  

  // multi.on("data", function() {
  //   console.log("Thermometer");
  //   console.log("  celsius      : ", multi.thermometer.celsius);
  //   console.log("  fahrenheit   : ", multi.thermometer.fahrenheit);
  //   console.log("  kelvin       : ", multi.thermometer.kelvin);
  //   console.log("--------------------------------------");

  //   console.log("Barometer");
  //   console.log("  pressure     : ", multi.barometer.pressure);
  //   console.log("--------------------------------------");

  //   console.log("Hygrometer");
  //   console.log("  humidity     : ", multi.hygrometer.relativeHumidity);
  //   console.log("--------------------------------------");

  //   console.log("Altimeter");
  //   console.log("  feet         : ", multi.altimeter.feet);
  //   console.log("  meters       : ", multi.altimeter.meters);
  //   console.log("--------------------------------------");
  // });

  // var sensorLight = new five.Sensor("A4");
  // Scale the sensor's data from 0-1023 to 0-10 and log changes
  // sensorLight.on("change", () => {
  //   console.log(sensorLight.scaleTo(0, 10));
  // });


  // var sensorTerm = new five.Sensor("A3");
  // // Scale the sensor's data from 0-1023 to 0-10 and log changes
  // sensorTerm.on("change", () => {
  //   console.log(sensorTerm.scaleTo(-30,120));
  // });

});