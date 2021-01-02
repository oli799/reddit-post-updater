var snoowrap = require('snoowrap');
require('dotenv').config();

const POST_ID = 'your_post_id';

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
			downs: parsedSubmission.downs,
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
		const response = await requester.getSubmission(POST_ID).edit(
			`## This post currently have:
- score: ${data.score}
- up(s): ${data.ups}
- down(s): ${data.downs}
- ratio: ${data.ratio}
- award(s): ${data.total_awards}
- comment(s): ${data.comments}
- report(s): ${data.reports}`
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
