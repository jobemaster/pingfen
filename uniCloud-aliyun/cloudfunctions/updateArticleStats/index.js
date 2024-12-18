const db = uniCloud.database();
const _ = db.command.aggregate; // 使用 aggregate API

// 云函数入口函数
exports.main = async (event, context) => {

	const res = await db.collection('guestbook')
		.groupBy('article_id')
		.groupField('avg(value) as totalScore,count(*) as totalPerson ')
		.get()
	console(res);
};