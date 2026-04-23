import { native, sys } from "cc";
/**
 * 广告服务：集中广告触发策略，避免业务层重复实现。
 * 当前未接入任何广告 SDK，仅保留可替换的占位接口。
 */
class _AdService {
    /**
     * 关卡开始上报占位：lv_start
     */
    public reportLvStart(lv: number): void {
        try {
            console.log('[AdService] lv_start', { lv });
        } catch (err) {
            console.warn('[AdService] reportLvStart 调用失败', err);
        }
    }

    /**
     * 关卡通关上报占位：lv_finish
     */
    public reportLvFinish(lv: number): void {
        try {
            console.log('[AdService] lv_finish', { lv });
        } catch (err) {
            console.warn('[AdService] ShowInterstitial 调用失败', err);
        }
    }

    /**
     * 占位：前台广告接口，后续接入真实 SDK 时替换此实现。
     */
    public showSplash(): void {
        try {
            if (sys.isNative) {
                // native.reflection.callStaticMethod("com/ad/AdSdk", "showAd", "(Ljava/lang/String;)V", "Splash");
            }
        } catch (err) {
            console.warn('[AdService] ShowSplash 调用失败', err);
        }
    }

    /**
     * 占位：结算插屏接口，后续接入真实 SDK 时替换此实现。
     */
    public showInterstitial(next?: () => void): void {
        try {
            if (sys.isNative) {
                // native.reflection.callStaticMethod("com/ad/AdSdk", "showAd", "(Ljava/lang/String;)V", "Interstitial");
            }
        } catch (err) {
            console.warn('[AdService] ShowInterstitial 调用失败', err);
        }
        next && next();
    }
}

export const AdService = new _AdService();
