<template>
	<view class="page-container">
		<!-- 标题部分 -->
		<view class="title-section">
			<!-- 添加返回按钮 -->
			<view class="back-button" @click="goBack">
				<uni-icons type="left" size="24" color="#333"></uni-icons>
			</view>
			
			<view class="title-content">
				<view class="title-decoration"></view>
				<text class="page-title">{{title}}</text>
				<view class="title-decoration"></view>
			</view>
		</view>

		<!-- 留言列表部分 -->
		<view class="comments-list">
			<unicloud-db v-slot:default="{data, loading, error, options}" :options="formData" :collection="colList"
				ref="guestbook" foreignKey="guestbook.user_id" :getcount="true" :page-size="10" :orderby="'_id desc'">
				<view v-if="error">{{error.message}}</view>
				<view v-else>
					<view v-if="loading" class="loading">
						<uni-load-more status="loading"></uni-load-more>
					</view>
					<view v-else-if="data.length === 0" class="empty-state">
						<text>暂无评论，快来发表第一条评论吧���</text>
					</view>
					<view v-else class="comment-items">
						<view v-for="item in data" :key="item._id" class="comment-card">
							<!-- 评论头部：用户信息和评分 -->
							<view class="comment-header">
								<view class="user-info">
									<image class="avatar" 
										:src="item.user_id[0].avatar_file?.url || 'https://img2.baidu.com/it/u=402198160,996274945&fm=253&fmt=auto&app=138&f=JPEG?w=475&h=475'"
										mode="aspectFill"
									/>
									<text class="nickname">{{ item.user_id[0].nickname || '默认昵称' }}</text>
								</view>
								<uni-rate :readonly="true" :value="item.value" size="15"/>
							</view>
							
							<!-- 评论内容 -->
							<view class="comment-content">
								<text class="comment-text">{{ item.text }}</text>
								<view class="photo-grid" v-if="item.photo && item.photo.length">
									<image 
										v-for="(img, index) in item.photo" 
										:key="index"
										:src="img"
										mode="aspectFill"
										class="photo-item"
										@click="previewImage(item.photo, index)"
									/>
								</view>
							</view>
						</view>
					</view>

					<!-- 分页器 -->
					<view class="pagination">
						<uni-pagination 
							:total="formData.total" 
							:pageSize="10"
							:current="formData.current"
							@change="handlePageChange"
						/>
					</view>
				</view>
			</unicloud-db>
		</view>

		<!-- 添加悬浮按钮 -->
		<view class="float-button" @click="showInput">
			<text class="plus-icon">+</text>
		</view>

		<!-- 底部弹出输入框 -->
		<uni-popup ref="inputPopup" type="bottom">
			<view class="popup-content">
				<view class="popup-header">
					<text class="popup-title">发表评论</text>
					<text class="close-btn" @click="hideInput">×</text>
				</view>
				<view class="input-area">
					<textarea class="input-box" v-model="text" placeholder="请输入您的评论" />
					<view class="rate-section">
						<text class="rate-label">评分：</text>
						<uni-rate v-model="rateValue" @change="onChange" />
					</view>
					<uni-file-picker 
						limit="6" 
						title="添加图片" 
						@select="handleSelect"
						@success="uploadSuccess" 
						@delete="handleDelete"
						file-mediatype="image"
						mode="grid"
						:image-styles="imageStyles"
					></uni-file-picker>
					<button @click="sendMessage()" class="submit-btn" :class="{active: text}">发送</button>
				</view>
			</view>
		</uni-popup>

		<view>
			<!-- 提示信息弹窗 -->
			<uni-popup ref="message" type="message">
				<uni-popup-message :type="msgType" :message="messageText" :duration="2000"></uni-popup-message>
			</uni-popup>
		</view>
	</view>
</template>

<script>
	const db = uniCloud.database();
	export default {
		data() {
			return {
				// 当前显示 _id
				article_id: "",
				title: 'title',
				text: null,
				rateValue: null,
				messageText: "",
				// 数据表名
				// 查询字段，多个字段用 , 分割
				// field: 'user_id.nickname,user_id._id,avatar,excerpt,last_modify_date,comment_count,like_count,title,content',
				formData: {
					noData: '<p style="text-align:center;color:#666">详情加载中...</p>',
					current: 1,
					total: 0
				},
				photo: [],
				tempFiles: [],
				scrollTop: 0,
				old: {
					scrollTop: 0
				},
				imageStyles: {
					width: 50,
					height: 50,
				},
			}
		},
		computed: {
			uniStarterConfig() {
				return getApp().globalData.config
			},
			where() {
				//拼接where条件 查询条件 ,更多详见 ：https://uniapp.dcloud.net.cn/uniCloud/unicloud-db?id=jsquery
				return `article_id =="${this.article_id}"`
			},
			colList() {
				return [
					db.collection('guestbook').where(this.where).field(
						'user_id,_id,text,value,photo').getTemp(),
					db.collection('uni-id-users').field('_id,nickname,avatar_file').getTemp()
				]
			}
		},
		onLoad(event) {
			//获取真实新闻id，通常 id 来自上一个页面
			if (event.id) {
				this.article_id = event.id
			}
			//若上一页传递了标题过来，则设置导航栏标题
			if (event.title) {
				this.title = event.title
				uni.setNavigationBarTitle({
					title: event.title
				})
			}
		},
		methods: {
			// 添加返回方法
			goBack() {
				uni.navigateBack({
					delta: 1
				});
			},
			// 处理文件选择
			handleSelect(e) {
				console.log('选择文件:', e);
				this.tempFiles = e.tempFiles;
				// 选择后立即上传
				this.uploadFiles(e.tempFiles);
			},

			// 上传文件到云存储
			async uploadFiles(files) {
				try {
					uni.showLoading({
						title: '上传中...'
					});

					const uploadTasks = files.map(file => {
						return new Promise((resolve, reject) => {
							const extension = file.name.split('.').pop();
							const cloudPath = `guestbook/${Date.now()}-${Math.random().toString(36).slice(-6)}.${extension}`;
							
							uniCloud.uploadFile({
								filePath: file.tempFilePath || file.path,
								cloudPath: cloudPath,
								success: (res) => {
									console.log('单个文件上传成功:', res);
									resolve(res.fileID);
								},
								fail: (err) => {
									console.error('单个文件上传失败:', err);
									reject(err);
								}
							});
						});
					});

					const fileIDs = await Promise.all(uploadTasks);
					console.log('所有文件上传完成，fileIDs:', fileIDs);
					
					// 更新photo数组
					this.photo = [...this.photo, ...fileIDs];
					console.log('当前photo数组:', this.photo);

					uni.hideLoading();
					uni.showToast({
						title: '上传成功',
						icon: 'success'
					});
				} catch (error) {
					uni.hideLoading();
					console.error('文件上传失败:', error);
					uni.showToast({
						title: '上传失败',
						icon: 'error'
					});
				}
			},

			// 处理文件删除
			handleDelete(e) {
				const index = e.index;
				if (index !== undefined && this.photo[index]) {
					// 从云存储中删除文件
					uniCloud.deleteFile({
						fileList: [this.photo[index]],
						success: (res) => {
							console.log('文件删除成功:', res);
							// 从数组中移除
							this.photo.splice(index, 1);
						},
						fail: (err) => {
							console.error('文件删除失败:', err);
						}
					});
				}
			},

			// 添加更新评分统计的方法
			async updateArticleStats() {
				try {
					// 获取当前文章的所有评论的统计信息
					const res = await db.collection('guestbook')
						.where(`article_id == "${this.article_id}"`)
						.get();
						
					const comments = res.result.data;
					const totalComments = comments.length;
					const totalScore = comments.reduce((sum, comment) => sum + comment.value, 0);
					const averageScore = totalComments > 0 ? totalScore / totalComments : 0;

					// 更新文章的评论数和平均分
					await db.collection('opendb-news-articles')
						.doc(this.article_id)
						.update({
							number: totalComments,
							value: averageScore
						});

					console.log('统计更新成功');
				} catch (error) {
					console.error('统计更新失败:', error);
				}
			},

			async sendMessage() {
				if (this.rateValue == null) {
					this.messageText = "请输入评分";
					this.$refs.message.open();
					return;
				}
				if (!this.text) {
					this.messageText = "请输入文本";
					this.$refs.message.open();
					return;
				}

				try {
					// 确保photo数组存在且有效
					const photos = Array.isArray(this.photo) ? this.photo : [];
					console.log('准备存储的图片数组:', photos);

					// 准备数据对象
					const guestbookData = {
						text: this.text,
						article_id: this.article_id,
						value: this.rateValue,
						article_title: this.title,
						photo: photos
					};

					console.log('准备存储的完整数据:', guestbookData);

					// 存储到数据库
					const result = await db.collection("guestbook").add(guestbookData);
					console.log('数据库存储结果:', result);

					// 更新评论统计
					await this.updateArticleStats();

					// 清空表单
					this.photo = [];
					this.tempFiles = [];
					this.text = "";
					this.rateValue = 0;
					
					// 刷新列表并关闭弹窗
					this.$refs.guestbook.refresh();
					this.hideInput();

					uni.showToast({
						title: '发送成功',
						icon: 'success'
					});
				} catch (e) {
					console.error('存储到数据库失败:', e);
					uni.showToast({
						title: '发送失败: ' + e.message,
						icon: 'none'
					});
				}
			},
			onChange(e) {
				console.log(this.rateValue);
			},
			previewImage(photos, current) {
				uni.previewImage({
					urls: photos,
					current: current
				});
			},
			scroll: function(e) {
				console.log(e)
				this.old.scrollTop = e.detail.scrollTop
			},
			// 添加显示和隐藏输入框的方法
			showInput() {
				this.$refs.inputPopup.open('bottom')
			},
			hideInput() {
				this.$refs.inputPopup.close()
			},
			handlePageChange(e) {
				this.formData.current = e.current;
				this.$refs.guestbook.loadData({
					clear: true
				});
			}
		}
	}
</script>

<style>
	.page-container {
		padding: 20rpx;
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	/* 标题样式 */
	.title-section {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 30rpx 0;
		padding: 0 100rpx;
	}

	.title-decoration {
		width: 60rpx;
		height: 4rpx;
		background: linear-gradient(90deg, transparent, #007AFF);
	}

	.title-decoration:last-child {
		background: linear-gradient(90deg, #007AFF, transparent);
	}

	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		text-align: center;
	}

	/* 评论列表样式 */
	.comments-list {
		padding: 20rpx;
	}

	.comment-items {
		display: flex;
		flex-direction: column;
		gap: 30rpx;
	}

	.comment-card {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
	}

	.nickname {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}

	.comment-content {
		margin-top: 16rpx;
	}

	.comment-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
	}

	/* 图片网格优化 */
	.photo-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.photo-item {
		width: 100%;
		height: 200rpx;
		border-radius: 8rpx;
		background-color: #f5f5f5;
	}

	/* 分页器样式 */
	.pagination {
		margin: 40rpx 0;
		display: flex;
		justify-content: center;
	}

	/* 加载和空状态 */
	.loading, .empty-state {
		padding: 40rpx;
		text-align: center;
		color: #999;
	}

	/* 悬浮按钮样式 */
	.float-button {
		position: fixed;
		right: 30rpx;
		bottom: 30rpx;
		width: 100rpx;
		height: 100rpx;
		background-color: #007AFF;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
		z-index: 99;
	}

	.plus-icon {
		color: white;
		font-size: 60rpx;
		font-weight: bold;
	}

	/* 弹出层样式 */
	.popup-content {
		background-color: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding: 30rpx;
		min-height: 60vh;
	}

	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.popup-title {
		font-size: 32rpx;
		font-weight: bold;
	}

	.close-btn {
		font-size: 40rpx;
		color: #666;
		padding: 10rpx;
	}

	.input-area {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.input-box {
		width: 100%;
		height: 200rpx;
		padding: 20rpx;
		border: 1rpx solid #eee;
		border-radius: 12rpx;
		font-size: 28rpx;
	}

	.rate-section {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.rate-label {
		font-size: 28rpx;
		color: #666;
	}

	.submit-btn {
		margin-top: 30rpx;
		background-color: #007AFF;
		color: white;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 32rpx;
		border: none;
	}

	.submit-btn.active {
		background-color: #4cd964;
	}

	/* 返回按钮样式 */
	.back-button {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fff;
		border-radius: 50%;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
		position: absolute;
		left: 30rpx;
		transition: all 0.3s ease;
	}

	.back-button:active {
		transform: scale(0.95);
		background-color: #f5f5f5;
	}

	.title-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
	}
</style>