require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = "ENTER TOKEN HERE";
var CronJob = require('cron').CronJob;
var fs = require("fs");
var defaultChannel;

var jobSchedule = [];
var jobs = [];
const readline = require('readline');
bot.login(TOKEN);

//This function should take all the tasks in txt and queued them
function queueSchedule(){
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('reminder.txt')
  });
  
  lineReader.on('line', function (line) {
    let splitLine = line.split(' ');
    if(splitLine[0] === '!recurring')
      makeReminder(splitLine, line, true);
    else{
      makeRecurring(splitLine, line, true);
    }
  });

}

//Discord bot on
bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  
  for(const [key, value] of bot.channels){
    if(value.type === 'text'){
      defaultChannel = bot.channels.get(key);
      break;
    }
  }

  defaultChannel.send("Resetting up all the reminders...");
  queueSchedule();
});

//This function should enter current array of tasks into text file
function addToTxt(){
  fs.writeFile('reminder.txt', '', function(err){
    if(err) throw err;
    console.log("Replaced");
  });

  for(let i = 0; i < jobSchedule.length; i++){
    fs.appendFile('reminder.txt', jobSchedule[i]+ "\r\n", function(err){
      if(err) throw err;
      console.log("Added");
    });
  }
}

//This function should search for the element to remove array. Update txt
function removeJob(content){
  let idx = jobSchedule.lastIndexOf(content);
  if(idx < 0){
    return;
  }
  jobSchedule.splice(idx, 1);
  jobs[idx].stop();
  jobs.splice(idx, 1);
  addToTxt();
}

//This function makes a reminder at a certain day and time
function makeReminder(disCommand, msg, onStart){
  //Variables for cron
  let minutes = 0;
  let hours = 0;
  let dayofmonth = 0;
  let months = 0;
  let outputMessage = "";

  //variables for message
  let monthStr = "";
  let dayStr = "";
  let hourStr = "";
  let minStr = "";

  if(disCommand.length <= 3){
    msg.channel.send("Message not set. Reminder not set!");
    return;
  }
 
  //Parse date
  let date = disCommand[1].split('/');
  if(date.length != 2){
    console.log("invalid date");
    return;
  } //if incorrect argument for date
  monthStr = date[0];
  dayStr = date[1];
  let month = parseInt(date[0]);
  let day = parseInt(date[1]);
  months = month-1;
  dayofmonth = day;
  //if wrong input for month date
  if(month < 0 || month > 11 || day < 1 || day > 31){
    console.log("Failed date");  
    return;
  }

  //Parse Time
  let time = disCommand[2].split(':');
  if(time.length != 2){return;} //if incorrect argument for date
  hourStr = time[0];
  minStr = time[1];
  let hr = parseInt(time[0]);
  let min = parseInt(time[1]);
  hours = hr;
  minutes = min;
  //if wrong time numbers
  if(hr < 0 || hr > 23 || min < 0 || min > 59){
    console.log("Failed time");
    return;
  }

  //Parse rest of input and make message
  for(var j = 3; j < disCommand.length; j++){
    outputMessage += disCommand[j] + " ";
  }

  //makes the cron job
  let cronParam = minutes.toString() + ' ' + hours.toString() + ' ' + 
  dayofmonth.toString() + ' ' + months.toString() + ' *';
  console.log(cronParam);
  
  //Gets the message
  let contentString = "";
  if(onStart){
    contentString = msg;
  }
  else{
    contentString = msg.content;
  }
  
  //Gets the channel
  let sendChannel;
  if(onStart){
    sendChannel = defaultChannel;
  }
  else{
    sendChannel = msg.channel
  }
  var jobCron = new CronJob(cronParam, function(){
    removeJob(contentString);
    sendChannel.send(outputMessage);
    console.log("The task assigned to do was done");
    console.log(jobs);
  })
  jobCron.start();

  //append job to job schedule array and text file
  if(!onStart){
    console.log("HEre");
    jobSchedule.push(msg.content);
    jobs.push(jobCron);
    console.log(jobSchedule);
    addToTxt();
  }
  //Requeing items if bot crashes somehow
  else{
    jobSchedule.push(msg);
    jobs.push(jobCron);
    console.log(jobSchedule);
  }

  //Change so that it says what it's reminding
  if(!onStart)
    msg.channel.send("Reminder set at " + monthStr + "/" + dayStr + 
    " at " + hourStr + ":" + minStr + " for: " + outputMessage);
  
  //Requeueing items if bot crashes somehow
  else{
    defaultChannel.send("Requeueing reminder set at " + monthStr + "/" + dayStr + 
    " at " + hourStr + ":" + minStr + " for: " + outputMessage);
  }
}

//This makes a recurring reminder
function makeRecurring(disCommand, msg, onStart){
  //Variables for cron
  let minutes = 0;
  let hours = 0;
  let dayofweek = [];
  let outputMessage = "";

  //variables for message
  let dayofweekStr = "";
  let hourStr = "";
  let minStr = "";

  if(disCommand.length <= 3){
    msg.channel.send("Message not set. Reminder not set!");
    return;
  }
 
  console.log('Stop 1');
  //Parse date
  dayofweekStr = disCommand[1].toString();
  let daysweeksplit = disCommand[1].split(',');
  console.log(daysweeksplit);
  for(let k = 0; k < daysweeksplit.length; k++){
    let dy = daysweeksplit[k];
    switch(dy){
      case 'sunday':
        dayofweek.push(0);
        break;
      case 'monday':
        dayofweek.push(1);
        break;
      case 'tuesday':
        dayofweek.push(2);
        break;
      case 'wednesday':
        dayofweek.push(3);
        break;
      case 'thursday':
        dayofweek.push(4);
        break;
      case 'friday':
        dayofweek.push(5);
        break;
      case 'saturday':
        dayofweek.push(6);
        break;
      default:
        return;
    }
  }

  console.log('Stop 2');


  //Parse Time
  let time = disCommand[2].split(':');
  if(time.length != 2){return;} //if incorrect argument for date
  console.log('Stop 3');

  hourStr = time[0];
  minStr = time[1];
  let hr = parseInt(time[0]);
  let min = parseInt(time[1]);
  hours = hr;
  minutes = min;
  //if wrong time numbers
  if(hr < 0 || hr > 23 || min < 0 || min > 59){
    console.log("Failed time");
    return;
  }

  console.log('Stop 4');


  //Parse rest of input and make message
  for(var j = 3; j < disCommand.length; j++){
    outputMessage += disCommand[j] + " ";
  }

  //makes the cron job
  let cronParam = minutes.toString() + ' ' + hours.toString() + ' * * ' +
  dayofweek.toString();
  console.log(cronParam);
  
  //Gets the channel
  let sendChannel;
  if(onStart){
    sendChannel = defaultChannel;
  }
  else{
    sendChannel = msg.channel
  }
  var jobCron = new CronJob(cronParam, function(){
    sendChannel.send(outputMessage);
    console.log("The task assigned to do was done");
  })
  jobCron.start();

  console.log('Stop 5');

  //append job to job schedule array and text file
  if(!onStart){
    jobSchedule.push(msg.content);
    jobs.push(jobCron);
    console.log(jobSchedule);
    addToTxt();
  }
  //Requeing items if bot crashes somehow
  else{
    jobSchedule.push(msg);
    jobs.push(jobCron);
    console.log(jobSchedule);
  }

  //Change so that it says what it's reminding
  if(!onStart)
    msg.channel.send("Recurring reminder set at " + dayofweekStr + 
    " at " + hourStr + ":" + minStr + " for: " + outputMessage);
  
  //Requeueing items if bot crashes somehow
  else{
    defaultChannel.send("Recurring reminder set at " + dayofweek.toString() + 
    " at " + hourStr + ":" + minStr + " for: " + outputMessage);
  }
}

//List of commands
//!help
//!recurring --> creates a recurring reminder
//!reminder --> creates a 1 time reminder
//!del --> deletes a recurring reminder
//!listreminders
bot.on('message', msg => {
  let disCommand = msg.content.split(" ");
  for(var i = 0; i < disCommand.length; i++){
    disCommand[i] = disCommand[i].toLowerCase();
  }
  console.log(disCommand);

  //This takes care of reminder command.
  //The command is used like this:
  //Date = 07/22
  //Time = 13:25
  //Message = Message for reminder
  //!reminder [Date] [Time] [Message]
  if(disCommand[0] === '!reminder') {
    //Try to make reminder. Let user know if reminder not set
    try{
      makeReminder(disCommand, msg, false);
    }
    catch(error){
      msg.channel.send("Argument Invalid. Reminder not set!");
    }
  }

  //This takes care of recurring command.
  //The command is used like this:
  //DayOfWeek = Monday,Tuesday (no spaces in between or after commas)
  //Time = 12:35
  //Message = Message for reminder
  //!recurring [DayOfWeek,..] [Time] [Message]
  else if(disCommand[0] === '!recurring') {
    //Try to make reminder. Let user know if reminder not set
    try{
      makeRecurring(disCommand, msg, false);
    }
    catch(error){
      msg.channel.send("Argument Invalid. Reminder not set!");
    }
    
  }

});
