<script>
    import { authStore } from '$lib/stores/authStore.svelte.js';

    /** @type {import('@supabase/supabase-js').User | null} */
    let user = $derived(authStore.user);
    let authLoading = $derived(authStore.loading);
</script>

<div class="main-content-page">
    <!-- Main Content -->
    <main>
        <!-- History Section -->
        <section id="history" class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">주요 실적 & 연혁</h2>
                
                <div class="relative">
                    <!-- Timeline Line -->
                    <div class="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-green-300 via-blue-200 to-gray-300 transform md:-translate-x-1/2"></div>
                    
                    <div class="space-y-12">
                        <!-- 1996년 ~ 2005년 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:text-right md:pr-8">
                                <div class="inline-block bg-blue-50 border-2 border-blue-400 rounded-lg shadow-md p-6 max-w-md md:ml-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🏢</span>
                                        <span class="text-sm font-semibold text-blue-700">1996년 ~ 2005년</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">삼성그룹 소프트웨어 전문직 1기</h3>
                                    <p class="text-gray-600 text-sm mb-2">삼성 TV & Projection 개발 (ASM, C)</p>
                                    <p class="text-gray-600 text-sm mt-2">CDMA - GSM S/W 개발 (C)</p>
                                </div>
                            </div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:pl-8"></div>
                        </div>

                        <!-- 2006년 ~ 2011년 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:pl-8"></div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:text-left md:pl-8">
                                <div class="inline-block bg-gray-50 border border-gray-300 rounded-lg shadow-md p-6 max-w-md md:mr-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">📱</span>
                                        <span class="text-sm font-semibold text-gray-600">2006년 ~ 2011년</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">음원 다운로드/스트리밍 서비스 운영</h3>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 2012년 ~ 현재 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:text-right md:pr-8">
                                <div class="inline-block bg-green-50 border-2 border-green-400 rounded-lg shadow-md p-6 max-w-md md:ml-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🌐</span>
                                        <span class="text-sm font-semibold text-green-700">2012년 ~ 현재</span>
                                        <span class="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">운영중</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">다원재능 서비스 개발 및 서비스 운영</h3>
                                    <p class="text-gray-600 text-sm">PHP → Svelte + Node.js</p>
                                </div>
                            </div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:pl-8"></div>
                        </div>

                        <!-- 2017년 ~ 2022년 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:pl-8"></div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:text-left md:pl-8">
                                <div class="inline-block bg-gray-50 border border-gray-300 rounded-lg shadow-md p-6 max-w-md md:mr-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🔋</span>
                                        <span class="text-sm font-semibold text-gray-600">2017년 ~ 2022년</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">차량용 보조배터리 S/W 개발</h3>
                                    <p class="text-gray-600 text-sm">STM8 , STM32 + Bluetooth</p>
                                </div>
                            </div>
                        </div>

                        <!-- 2021년 ~ 현재 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:text-right md:pr-8">
                                <div class="inline-block bg-green-50 border-2 border-green-400 rounded-lg shadow-md p-6 max-w-md md:ml-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🏢</span>
                                        <span class="text-sm font-semibold text-green-700">2021년 ~ 현재</span>
                                        <span class="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">운영중</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">임대관리 서비스 개발 및 유지보수</h3>
                                    <p class="text-gray-600 text-sm">PHP + MySQL</p>
                                </div>
                            </div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:pl-8"></div>
                        </div>

                        <!-- 2022 ~ 2023년 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:pl-8"></div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:text-left md:pl-8">
                                <div class="inline-block bg-gray-50 border border-gray-300 rounded-lg shadow-md p-6 max-w-md md:mr-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🏭</span>
                                        <span class="text-sm font-semibold text-gray-600">2022년 ~ 2023년</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">중소기업 생산공정 관리 및 업무개선 Portal 개발</h3>
                                    <p class="text-gray-600 text-sm">PHP</p>
                                </div>
                            </div>
                        </div>

                        <!-- 2023년 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:text-right md:pr-8">
                                <div class="inline-block bg-gray-50 border border-gray-300 rounded-lg shadow-md p-6 max-w-md md:ml-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🌊</span>
                                        <span class="text-sm font-semibold text-gray-600">2023년</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">SK 해저케이블 관리 포털 개발</h3>
                                    <p class="text-gray-600 text-sm">Vue.js</p>
                                </div>
                            </div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:pl-8"></div>
                        </div>

                        <!-- 2023년 ~ 2024년 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:pl-8"></div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:text-left md:pl-8">
                                <div class="inline-block bg-gray-50 border border-gray-300 rounded-lg shadow-md p-6 max-w-md md:mr-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">🛏️</span>
                                        <span class="text-sm font-semibold text-gray-600">2023년 ~ 2024년</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">코골이 베개 개발</h3>
                                    <p class="text-gray-600 text-sm">STM32 + Bluetooth + WiFi</p>
                                </div>
                            </div>
                        </div>

                        <!-- 2024년 ~ 현재 -->
                        <div class="relative flex items-start md:items-center">
                            <div class="flex-1 md:text-right md:pr-8">
                                <div class="inline-block bg-green-50 border-2 border-green-400 rounded-lg shadow-md p-6 max-w-md md:ml-auto">
                                    <div class="flex items-center mb-2">
                                        <span class="text-2xl mr-2">⚡</span>
                                        <span class="text-sm font-semibold text-green-700">2024년 ~ 현재</span>
                                        <span class="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">운영중</span>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Svelte + Supabase + Vercel 연동 서비스 개발</h3>
                                    <p class="text-gray-600 text-sm">모던 웹 기술 스택</p>
                                </div>
                            </div>
                            <!-- Timeline Dot -->
                            <div class="absolute left-8 md:left-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2"></div>
                            <div class="flex-1 md:pl-8"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
</div>
