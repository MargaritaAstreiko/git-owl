
"use strict";


let fs = require('fs');


var stat = async function (config, specialParams) {
    // const config = require('./env');
    const git = require('git-cmd');
    const _ = require("lodash");
    const moment = require('moment'); require('twix');
    

  

    let repositories = config.cwd;

    function getStat(rep, since, until) {
        let cmd = git([
            'log',
            '--no-merges',  
            '--pretty=medium',
            '--stat',
            '--all'
        ],
            { cwd: rep }
        );

        if (since) {
            cmd.push(`--since=${since}`);
        }
        if (until) {
            cmd.push(`--until=${until}`);
        }

        return cmd.array();
    }

    let resultText = '';
    for (let rep of repositories) {
        if (config.prepull) {
            await git(['pull', 'origin'], { cwd: rep }).pass();
        }
        resultText += await getStat(rep, config.since, config.until);
    }

    let commits = resultText.split(/^commit .{40,40}$/mi);
    
    let resultStat = {
        changed: 0,
        authors: {},
        daily: {},
        commitsName:[],
    };


    for (let commit of commits) {
        if (!commit) {
            continue;
        }

        let author = (/Author: (.+)( $| <)/mi).exec(commit)[1];
        let commitNames=(/\s{4}(.+)/mi).exec(commit)[1];
        let day = (/Date:(.+)/mi).exec(commit)[1];
        resultStat.commitsName.push({
            name: author,
            commit:commitNames,
            day:day

        })

        if (config.users[0] === "" || config.users.includes(author)) {
            if (config.ignoreUsers.some(user => user === author)) {
                continue;
            }

            if (!resultStat.authors[author]) {
                resultStat.authors[author] = {
                    name: author,
                    commits: 0,
                    changed: 0,
                    insertions: 0,
                    deletions: 0,
                    byExt: {
                        other: {
                            name: 'other',
                            changed: 0,
                            percent: 0,
                            extensions: []
                        }
                    }
                };
                for (let ext of config.statExtensions) {
                    resultStat.authors[author].byExt[ext] = {
                        name: ext,
                        changed: 0,
                        percent: 0,
                        extensions: []
                    };
                }
            }

            resultStat.authors[author].commits += 1;

            let fileChangesRegExp = new RegExp(`^(.+?)(\\.(${config.statExtensions.join('|')}))* +\\| +(\\d+) ((\\+|-)+)`, 'gmi');
            let info;
            while (info = fileChangesRegExp.exec(commit)) {
                let fileName = info[0];
                if (config.statIgnore.some(regExp => regExp.test(fileName))) {
                    continue;
                }
                let changed = (info[5] || '').length,
                    changesArr = Array.from(info[5]),
                    insertions = changesArr.filter(x => x === '+').length,
                    fileExt = (info[3] || 'other').toLowerCase(),
                    deletions = changed - insertions;

                if (fileExt === 'other') {
                    let data = /(\.(\w{2,5}))* +\| +(\d+) ((\+|-)+)/.exec(info[0]);

                    resultStat.authors[author].byExt[fileExt].extensions.push(data[2]);
                }
                resultStat.changed += changed;
                resultStat.authors[author].changed += changed;
                resultStat.authors[author].insertions += insertions;
                resultStat.authors[author].deletions += deletions;
                resultStat.authors[author].byExt[fileExt].changed += changed;
            }

            if (config.daily) {


                
                day = (new Date(Date.parse(day))).toDateString();

                if (!resultStat.daily[day]) {
                    resultStat.daily[day] = {
                        date: day,
                        commits: 0,
                        changed: 0,
                        insertions: 0,
                        deletions: 0,
                    };
                }
                resultStat.daily[day].commits += 1;

                let info;
                while (info = fileChangesRegExp.exec(commit)) {
                    let fileName = info[0];
                    if (config.statIgnore.some(regExp => regExp.test(fileName))) {
                        continue;
                    }
                    let changed = (info[5] || '').length,
                        changesArr = Array.from(info[5]),
                        insertions = changesArr.filter(x => x === '+').length,
                        deletions = changed - insertions;
                    resultStat.daily[day].changed += changed;
                    resultStat.daily[day].insertions += insertions;
                    resultStat.daily[day].deletions += deletions;
                }
            }
        }
    }
    resultStat.authors = _(resultStat.authors).map(author => {
        author.percent = author.changed / resultStat.changed;
        let insertionsPrecent = author.insertions / (author.insertions + author.deletions);
        let deletionsPrecent = author.deletions / (author.insertions + author.deletions);
       
           
        
     
        author.byExt = _(author.byExt).map(ext => {
            ext.percent = ext.changed / author.changed;
            ext.extensions = _.uniq(ext.extensions).filter(x => x);

            return ext;
        }).filter(x => x.changed).orderBy('changed', 'desc').value();

        return author;
    }).orderBy('changed', 'desc').value();

    if (config.daily) {
       

        resultStat.daily = _(resultStat.daily).map(day => {
    
           
            switch (day.commits.toString().length) {
                case 1:
                    day.commits += '  '; //alignment to 3 digits limit
                    break;
                case 2:
                    day.commits += ' '; //alignment to 3 digits limit
                    break;
                default:
                    break;
            }
            return day;
        }).value();

    }
  
   
        let lastDay = resultStat.daily[0].date;
        let firstDay = resultStat.daily[resultStat.daily.length - 1].date;

        firstDay = Date.parse(firstDay);
        lastDay = Date.parse(lastDay);

        var itr = moment.twix(new Date(firstDay), new Date(lastDay)).iterate("days");
        let allDaysInPeriod = [];
        while (itr.hasNext()) {
        
            let obj = { date: itr.next().toDate().toDateString(), commits: "0  ", changed: 0, insertions: 0, deletions: 0};
            allDaysInPeriod.push(obj)
        }
        allDaysInPeriod.forEach((emptyDay, index) => {
            resultStat.daily.forEach(day => {
                if (day.date === emptyDay.date) {
                    allDaysInPeriod[index] = day;
                }
            })
        });
        resultStat.daily=allDaysInPeriod;
        
      
 


    if(specialParams.output == "json"){
        return {json: [resultStat.authors, resultStat.daily, resultStat.commitsName]};
    }

    
   
    

}
module.exports = stat;