import config from './config';
import jobsStorage from './jobs-storage';
import badge from './badge';
import storage from './storage';

export default {
    /**
     * Fetch jobs from server
     * @return {Array}
     */
    fetch() {
        let xhr = new XMLHttpRequest();

        xhr.open("GET", 'https://www.upwork.com/ab/find-work/api/feeds/search', false);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();

        if(xhr.status !== 200) {
            throw { code: xhr.status };
        }

        return JSON.parse(xhr.responseText);
    },
    /**
     * Fetch jobs and make notification if there are new
     * @return {Void}
     */
    fetchAndNotify() {
        try {
            let { results } = this.fetch();
            let freshJobs = jobsStorage.push(results);
            let unreadJobs = jobsStorage.getUnreadJobs();

            badge.getText((text) => {
                if(text === 'err') {
                    storage.store('auth', true);
                    badge.setCounter(unreadJobs.length);
                }
            });

            if(freshJobs.length > 0) {
                badge.setCounter(freshJobs.length);

                chrome.notifications.create(++notifications + '-notification', {
                    type: 'basic',
                    iconUrl: './notification-icon.png',
                    title: 'You got ' + freshJobs.length + ' new jobs!',
                    message: "Don't miss your chance",
                    buttons: [{
                        title: "Click here to take a look"
                    }]
                });
            }
        } catch(err) {
            if(err.code === 401) {
                storage.store('auth', false);
                badge.refresh();
                badge.setText('err');
            }

            console.log(err);
        }
    }
}