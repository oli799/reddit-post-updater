const snoowrap = require('snoowrap');
require('dotenv').config();

const POST_ID = 'your_post_id';
const COMMENT_ID = 'your_comment_id';

const requester = new snoowrap({
	userAgent: process.env.REDDIT_USER_AGENT,
	clientId: process.env.REDDIT_CLIENT_ID,
	clientSecret: process.env.REDDIT_CLIENT_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASSWORD,
});

async function getData() {
	try {
		const submission = await requester.getSubmission(POST_ID).fetch();
		const parsedSubmission = await submission.toJSON();
		return {
			score: parsedSubmission.score,
			ups: parsedSubmission.ups,
			ratio: parsedSubmission.upvote_ratio,
			comments: parsedSubmission.num_comments,
			reports: parsedSubmission.num_reports,
			total_awards: parsedSubmission.total_awards_received,
		};
	} catch (error) {
		console.log('Post update failed while getting score: ', error.message);
	}
}

async function updateBody(data) {
	try {
		/* 
			calculate ups and downs based on post ratio
			source: @jawawizard
			https://www.reddit.com/r/javascript/comments/kp2c1l/statistics_for_this_post_are_updated_real_time_in/ghv4qaj?utm_source=share&utm_medium=web2x&context=3
		*/
		const all_votes = Math.round(
			data.score / (data.ratio - (1 - data.ratio))
		);
		const app_ups = Math.round(all_votes * data.ratio);
		const app_downs = Math.round(all_votes * (1 - data.ratio));

		const response = await requester.getComment(COMMENT_ID).edit(
			`## This post currently have:
- score: ${data.score}
- approximate up(s): ${app_ups}
- approximate down(s):  ${app_downs}
- ratio: ${data.ratio}
- award(s): ${data.total_awards}
- comment(s): ${data.comments}`
		);

		return response;
	} catch (error) {
		console.log('Post update failed while updating body: ', error.message);
	}
}

(async function () {
	// update post every 5 seconds
	setInterval(async function () {
		const data = await getData();
		const response = await updateBody(data);

		if (response.json.errors.length === 0) {
			console.log('Post updated successfully at: ', new Date());
		} else {
			console.log(
				'Post update failed while updating body: ',
				response.json.errors
			);
		}
	}, 5000);
})();
