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
		// calculate downs based on allvotes and upvotes
		const all_votes = Math.round((data.ups / (data.ratio * 100)) * 100);
		const downs = all_votes - data.ups;

		const response = await requester.getComment(COMMENT_ID).edit(
			`## This post currently have:
- score: ${data.score}
- up(s): ${data.ups}
- approximate down(s):  ${downs}
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
