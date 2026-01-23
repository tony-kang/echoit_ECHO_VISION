<script>
	import { goto } from '$app/navigation';
	import InquiryForm from '$lib/components/InquiryForm.svelte';
	import ___prjConst from '$prj/prjConst';
	
	let { showInquiryModal = $bindable(false), user } = $props();
	let showInquirySuccess = $state(false);
	
	function handleInquiryClick() {
		if (!user) {
			alert('문의하기는 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
			goto('/login');
			return;
		}
		showInquiryModal = true;
		showInquirySuccess = false;
	}
	
	/**
	 * @param {any} data
	 */
	function handleInquirySuccess(data) {
		showInquiryModal = false;
		showInquirySuccess = true;
		setTimeout(() => {
			showInquirySuccess = false;
		}, 5000);
	}
	
	function handleInquiryCancel() {
		showInquiryModal = false;
	}
</script>

<!-- Footer -->
<footer class="bg-gray-900 text-white py-12">
	<div class="max-w-7xl mx-auto px-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
			<div>
				<!-- <img 
					src="/logo/logo_w.png" 
					alt="Esther Logistics Logo" 
					style="height: 40px;"
				/> -->
				<h4 class="pl-3 text-sm mb-2">{___prjConst.oAuth.appName}</h4>
			</div>
			<div>
				<h5 class="font-semibold mb-4">회사 정보</h5>
				<ul class="space-y-2 text-sm text-gray-400">
					<li>CEO: {___prjConst.company.ceo}</li>
					<li>주소: {___prjConst.company.address}</li>
				</ul>
			</div>
		</div>

		<div class="border-t border-gray-800 pt-8">
			<div class="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
				<div class="mb-4 md:mb-0">
					<p class="mb-1">{___prjConst.copyright}</p>
					<p class="text-xs">{___prjConst.company.name}</p>
					<p class="text-xs mt-1 text-gray-500">Version {___prjConst.VERSION}</p>
				</div>
				<div class="flex space-x-6">
					<a href="terms/terms.html" class="hover:text-white transition">이용약관</a>
					<a href="terms/privacy.html" class="hover:text-white transition">개인정보처리방침</a>
					<button 
						onclick={handleInquiryClick} 
						class="hover:text-white transition" 
						style="background: none; border: none; color: inherit; font: inherit; cursor: pointer;"
					>
						문의하기
					</button>
				</div>
			</div>
		</div>
	</div>
</footer>

<!-- 문의하기 모달 -->
{#if showInquiryModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => showInquiryModal = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>문의하기</h2>
				<button onclick={() => showInquiryModal = false} class="modal-close">×</button>
			</div>
			<div class="modal-body">
				<InquiryForm 
					onSuccess={handleInquirySuccess}
					onCancel={handleInquiryCancel}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- 문의 성공 메시지 -->
{#if showInquirySuccess}
	<div class="success-toast">
		<div class="success-content">
			<span class="success-icon">✅</span>
			<p>문의가 성공적으로 접수되었습니다!</p>
		</div>
	</div>
{/if}

<style>
	/* 모달 스타일 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 700px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}
	
	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		background: white;
		z-index: 10;
	}
	
	.modal-header h2 {
		margin: 0;
		font-size: 1.5em;
		color: #333;
	}
	
	.modal-close {
		background: none;
		border: none;
		font-size: 2em;
		cursor: pointer;
		color: #999;
		line-height: 1;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.modal-close:hover {
		color: #333;
	}
	
	.modal-body {
		padding: 0;
	}
	
	/* 성공 토스트 */
	.success-toast {
		position: fixed;
		top: 80px;
		right: 20px;
		z-index: 1001;
		animation: slideIn 0.3s ease-out;
	}
	
	.success-content {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		padding: 16px 24px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.success-icon {
		font-size: 1.5em;
	}
	
	.success-content p {
		margin: 0;
		font-weight: 500;
	}
	
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
