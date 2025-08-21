import cron from 'cron';
import https from 'https';

const job = new cron.CronJob("*/14 * * * *", function(){
    https.get(process.env.API_URL,(res)=>{
        if(res.statusCode === 200){
            console.log("Get request send successfully");
        }else{
            console.error(`Failed to send request, ${res.statusCode}`);
        }
    }).on("error",(err) => console.log("Error while sending request",err));
});

export default job;