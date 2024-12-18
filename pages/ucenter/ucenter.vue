<template>
	<view class="center">
		<uni-sign-in ref="signIn"></uni-sign-in>
		<!-- 用户信息区域 -->
		<view class="userInfo" @click.capture="toUserInfo">
			<view class="user-header">
				<cloud-image width="150rpx" height="150rpx" v-if="hasLogin&&userInfo.avatar_file&&userInfo.avatar_file.url"
					:src="userInfo.avatar_file.url" class="avatar-image"></cloud-image>

				<view v-else class="defaultAvatarUrl">
					<uni-icons color="#ffffff" size="50" type="person-filled" />
				</view>

				<view class="logo-title">
					<text class="user-name" v-if="hasLogin">{{userInfo.nickname||userInfo.username||userInfo.mobile}}</text>
					<text class="user-name login-text" v-else @click="toLogin">点击登录</text>
				</view>
				<text class="user-desc" v-if="hasLogin">欢迎使用景点评分系统</text>
			</view>
		</view>

		<!-- 功能列表 -->
		<view class="function-list">
			<uni-list class="menu-list" v-for="(sublist, index) in ucenterList" :key="index">
				<uni-list-item v-for="(item,i) in sublist" :key="i"
					:title="item.title"
					link
					:rightText="item.rightText"
					:clickable="true"
					:to="item.to"
					@click="ucenterListClick(item)"
					:show-extra-icon="true"
					:extraIcon="{type:item.icon,color:'#007AFF'}"
					class="menu-item">
					<template v-slot:footer>
						<view v-if="item.showBadge" class="item-footer">
							<text class="item-footer-text">{{item.rightText}}</text>
							<view class="item-footer-badge"></view>
						</view>
					</template>
				</uni-list-item>
			</uni-list>
		</view>

		<!-- 版权信息 -->
		<view class="copyright">
			<text class="copyright-text">© 2024 景点评分系统</text>
		</view>
	</view>
</template>

<script>
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	
	export default {
		data() {
			return {
				ucenterList: [
					[{
						"title": "我的评论",
						"to": '/pages/ucenter/read-news-log/read-news-log',
						"icon": "chat"
					}],
					[{
						"title": "意见反馈",
						"to": '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback',
						"icon": "help"
					}, {
						"title": "设置",
						"to": '/pages/ucenter/settings/settings',
						"icon": "gear"
					}]
				]
			}
		},
		computed: {
			userInfo() {
				return store.userInfo
			},
			hasLogin() {
				return store.hasLogin
			}
		},
		methods: {
			toUserInfo() {
				if (!this.hasLogin) {
					this.toLogin()
					return
				}
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
				})
			},
			toLogin() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
				})
			},
			ucenterListClick(item) {
				if (!item.to && item.event) {
					this[item.event]();
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* #ifndef APP-NVUE */
	view {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}

	page {
		background-color: #f8f8f8;
	}
	/* #endif*/

	.center {
		flex: 1;
		flex-direction: column;
		background-color: #f8f8f8;
	}

	.userInfo {
		padding: 60rpx 40rpx;
		background-image: linear-gradient(45deg, #007AFF, #1cbbb4);
		border-radius: 0 0 40rpx 40rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.user-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 0;
	}

	.avatar-image {
		width: 160rpx !important;
		height: 160rpx !important;
		border-radius: 80rpx;
		border: 4rpx solid rgba(255, 255, 255, 0.8);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.defaultAvatarUrl {
		width: 160rpx;
		height: 160rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 80rpx;
		justify-content: center;
		align-items: center;
		border: 4rpx solid rgba(255, 255, 255, 0.8);
	}

	.logo-title {
		margin-top: 20rpx;
		align-items: center;
	}

	.user-name {
		font-size: 36rpx;
		color: #FFFFFF;
		font-weight: 500;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.login-text {
		padding: 10rpx 30rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 30rpx;
		font-size: 32rpx;
	}

	.user-desc {
		margin-top: 10rpx;
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.function-list {
		margin: 30rpx;
	}

	.menu-list {
		background-color: #FFFFFF;
		border-radius: 16rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.menu-item {
		border-bottom: 1rpx solid #f5f5f5;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	/* 修改列表样式 */
	.menu-list :deep(.uni-list-item__container) {
		padding: 24rpx 30rpx;
	}

	.menu-list :deep(.uni-list-item__content-title) {
		font-size: 28rpx;
		color: #333;
	}

	.menu-list :deep(.uni-icons) {
		font-size: 36rpx;
	}

	.item-footer {
		flex-direction: row;
		align-items: center;
	}

	.item-footer-text {
		color: #999;
		font-size: 24rpx;
		padding-right: 10rpx;
	}

	.item-footer-badge {
		width: 16rpx;
		height: 16rpx;
		border-radius: 8rpx;
		background-color: #DD524D;
	}

	.copyright {
		position: fixed;
		bottom: 40rpx;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.copyright-text {
		font-size: 24rpx;
		color: #999;
	}
</style>