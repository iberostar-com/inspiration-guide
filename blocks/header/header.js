import { resolveFragmentPath } from '../../scripts/iberostar/fragments.js';
import { loadFragment } from '../fragment/fragment.js';

const DEFAULT_NAV_PATH = '/nav';
const DESKTOP = window.matchMedia('(width >= 1440px)');
const SCROLL_HYSTERESIS_PX = 12;

const LOGO_MOBILE = `<svg class="nav-logo-mark" width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M20.5714 11.0215V9.58425H9.52165V11.0215H20.5714Z" fill="#3AA496"/>
<path d="M11.0389 6.3713V0H9.6017V6.36039C9.82364 6.324 10.0529 6.29853 10.2857 6.29853C10.544 6.29853 10.7951 6.324 11.0425 6.3713H11.0389Z" fill="#3AA496"/>
<path d="M6.27258 9.58424H0V11.0215H6.24711C6.21436 10.8141 6.19253 10.6067 6.19253 10.3884C6.19253 10.1118 6.22164 9.84259 6.27258 9.5806V9.58424Z" fill="#3AA496"/>
<path d="M14.9392 1.05521L13.6112 0.498497L11.148 6.3895C11.6283 6.49138 12.0758 6.68059 12.476 6.93893L14.9392 1.05521Z" fill="#3AA496"/>
<path d="M13.6039 8.00506L18.0828 3.52587L17.064 2.50704L12.5743 6.99715C12.9745 7.26641 13.3201 7.60845 13.6039 8.00142V8.00506Z" fill="#3AA496"/>
<path d="M20.0984 7.04082L19.5418 5.71634L13.7167 8.16516C13.975 8.56542 14.1679 9.01297 14.2734 9.48964L20.0984 7.04082Z" fill="#3AA496"/>
<path d="M7.01481 0.487581L5.6868 1.0443L8.14271 6.91346C8.54657 6.6624 8.99773 6.48046 9.48163 6.38222L7.01481 0.49122V0.487581Z" fill="#3AA496"/>
<path d="M8.04083 6.97168L3.56198 2.49249L2.54323 3.51131L6.99297 7.9614C7.28041 7.57206 7.63333 7.2373 8.03719 6.97168H8.04083Z" fill="#3AA496"/>
<path d="M1.08788 5.70179L0.531207 7.02626L6.30532 9.45689C6.41811 8.98022 6.61094 8.53267 6.87291 8.13605L1.08788 5.70179Z" fill="#3AA496"/>
<path d="M15.4268 13.987C13.9496 13.987 13.1782 14.4237 12.4979 14.8094C11.8975 15.1478 11.3809 15.4425 10.2857 15.4425C9.19056 15.4425 8.67391 15.1478 8.07358 14.8094C7.3932 14.4237 6.62186 13.987 5.14467 13.987C3.66749 13.987 2.89616 14.4237 2.21578 14.8094C1.82647 15.0313 1.46627 15.2315 0.967811 15.3442C1.17884 15.7991 1.41897 16.2357 1.69185 16.6542C2.19031 16.4941 2.57598 16.2794 2.93254 16.0756C3.53287 15.7372 4.05316 15.4425 5.14467 15.4425C6.23619 15.4425 6.75648 15.7372 7.35681 16.0756C8.03719 16.4613 8.80853 16.898 10.2857 16.898C11.7629 16.898 12.5342 16.4613 13.2146 16.0756C13.8149 15.7372 14.3316 15.4425 15.4268 15.4425C16.5219 15.4425 17.0386 15.7372 17.6389 16.0756C18.01 16.2867 18.4139 16.5086 18.9414 16.6724C19.2143 16.2539 19.4581 15.8136 19.6727 15.3588C19.1379 15.2496 18.7631 15.0422 18.3593 14.813C17.6789 14.4273 16.9076 13.9907 15.4304 13.9907L15.4268 13.987Z" fill="#3AA496"/>
<path d="M6.31987 11.5673C5.9815 11.4982 5.59947 11.4545 5.14467 11.4545C3.66749 11.4545 2.89616 11.8912 2.21578 12.2769C1.66638 12.5861 1.17884 12.8554 0.265603 12.9027C0.374755 13.3903 0.516651 13.867 0.691294 14.3291C1.73551 14.2163 2.36859 13.867 2.93254 13.5467C3.53287 13.2084 4.05316 12.9136 5.14467 12.9136C6.23619 12.9136 6.75648 13.2084 7.35681 13.5467C7.57148 13.6668 7.79706 13.7942 8.05175 13.9106C7.22219 13.3721 6.59639 12.5461 6.31987 11.571V11.5673Z" fill="#3AA496"/>
</svg>`;

const LOGO_DESKTOP = `<svg class="nav-logo-mark" width="134" height="32" viewBox="0 0 134 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M33.4906 22.2436V19.9043H15.4988V22.2436H33.4906Z" fill="#3AA496"/>
<path d="M17.9747 14.6735V4.30301H15.6354V14.6564C15.9997 14.5938 16.3697 14.554 16.7453 14.554C17.1665 14.554 17.5763 14.5995 17.9747 14.6735Z" fill="#3AA496"/>
<path d="M10.2111 19.9043H0V22.2436H10.1713C10.12 21.9078 10.0859 21.5663 10.0859 21.2134C10.0859 20.7637 10.1314 20.3255 10.2168 19.8986L10.2111 19.9043Z" fill="#3AA496"/>
<path d="M24.3268 6.02194L22.1639 5.11694L18.1512 14.7076C18.931 14.8784 19.6652 15.1858 20.3141 15.6013L24.3211 6.02194H24.3268Z" fill="#3AA496"/>
<path d="M22.1525 17.3316L29.4437 10.0404L27.7874 8.38404L20.4734 15.698C21.128 16.1363 21.6915 16.6941 22.1468 17.3316H22.1525Z" fill="#3AA496"/>
<path d="M32.7279 15.7663L31.8172 13.6091L22.3347 17.5991C22.7559 18.248 23.0689 18.9765 23.2454 19.7563L32.7279 15.7663Z" fill="#3AA496"/>
<path d="M11.4235 5.09417L9.26058 5.99917L13.2562 15.5557C13.9165 15.1516 14.6507 14.8499 15.4362 14.6906L11.4235 5.09417Z" fill="#3AA496"/>
<path d="M13.0912 15.6525L5.79996 8.36127L4.14364 10.0176L11.3893 17.2633C11.856 16.6315 12.4309 16.0851 13.0855 15.6525H13.0912Z" fill="#3AA496"/>
<path d="M1.77015 13.5864L0.859464 15.7436L10.2623 19.6994C10.4445 18.9196 10.7575 18.1967 11.1844 17.5479L1.77015 13.5864Z" fill="#3AA496"/>
<path d="M25.1237 27.076C22.7217 27.076 21.4638 27.7874 20.3539 28.4135C19.3749 28.9656 18.5325 29.4437 16.751 29.4437C14.9695 29.4437 14.1271 28.9656 13.1481 28.4135C12.0382 27.7874 10.7803 27.076 8.37835 27.076C5.9764 27.076 4.71851 27.7874 3.60861 28.4135C2.97113 28.7721 2.39056 29.0965 1.57094 29.2844C1.91245 30.0243 2.31088 30.7415 2.74915 31.4188C3.55738 31.157 4.18917 30.8098 4.76974 30.4797C5.74873 29.9276 6.59112 29.4494 8.37266 29.4494C10.1542 29.4494 10.9966 29.9276 11.9756 30.4797C13.0855 31.1058 14.3434 31.8172 16.7453 31.8172C19.1473 31.8172 20.4051 31.1058 21.515 30.4797C22.494 29.9276 23.3364 29.4494 25.118 29.4494C26.8995 29.4494 27.7419 29.9276 28.7209 30.4797C29.3242 30.8212 29.9845 31.1854 30.8382 31.4473C31.2822 30.7642 31.6806 30.0528 32.0278 29.3071C31.157 29.125 30.548 28.7892 29.8877 28.4135C28.7778 27.7874 27.5256 27.076 25.118 27.076H25.1237Z" fill="#3AA496"/>
<path d="M10.2908 23.1315C9.73869 23.0177 9.11828 22.9494 8.37835 22.9494C5.97071 22.9494 4.71851 23.6609 3.60861 24.287C2.71499 24.7935 1.92383 25.2318 0.432578 25.3058C0.609024 26.1027 0.842388 26.8767 1.12698 27.6281C2.82314 27.4459 3.85905 26.8767 4.78112 26.3531C5.76011 25.801 6.6025 25.3229 8.38404 25.3229C10.1656 25.3229 11.008 25.801 11.987 26.3531C12.3342 26.5523 12.7041 26.7572 13.1196 26.945C11.765 26.0685 10.7518 24.7195 10.3022 23.1372L10.2908 23.1315Z" fill="#3AA496"/>
<path d="M47.5722 25.3456V31.6237H45.9955L45.6426 30.9521C44.7376 31.5156 43.6277 31.8172 42.478 31.8172C40.7818 31.8172 39.3304 31.2708 38.3571 30.2406C37.435 29.2844 36.9228 27.9753 36.9228 26.3132C36.9228 24.6512 37.5603 23.2681 38.6759 22.2778C39.7175 21.3386 41.2599 20.8093 43.1326 20.8093C44.6181 20.8093 45.9955 21.128 47.1453 21.7313L46.5078 23.234C45.4093 22.79 44.3164 22.5623 43.1269 22.5623C41.9373 22.5623 41.055 22.8982 40.3834 23.4673C39.6207 24.1048 39.2166 25.0952 39.2166 26.3132C39.2166 27.2353 39.4443 28.1176 39.9622 28.7892C40.5086 29.5291 41.4136 30.03 42.6317 30.03C43.6562 30.03 44.4531 29.8194 45.3581 29.3925V27.0247L42.791 26.8483V25.3456H47.5722Z" fill="#3AA496"/>
<path d="M50.5604 21.0085H52.8599V27.093C52.8599 28.0493 53.1103 28.7721 53.5827 29.2844C54.0267 29.7625 54.6812 30.0243 55.5293 30.0243C56.3774 30.0243 57.0832 29.7796 57.5101 29.3185C57.9882 28.8063 58.2159 28.1176 58.2159 27.0873V21.0028H60.4812V27.019C60.4812 28.5387 59.986 29.7625 59.1379 30.5537C58.2728 31.3676 57.032 31.8115 55.5122 31.8115C54.0779 31.8115 52.8428 31.4074 51.9776 30.6276C51.0954 29.8308 50.5774 28.6127 50.5604 27.019V21.0028V21.0085Z" fill="#3AA496"/>
<path d="M65.8258 21.0085V31.6237H63.5605V21.0085H65.8258Z" fill="#3AA496"/>
<path d="M73.2707 21.0085C75.1433 21.0085 76.5435 21.4126 77.4826 22.2834C78.5072 23.2397 78.9853 24.5829 78.9853 26.3189C78.9853 28.0549 78.5072 29.3982 77.4997 30.3317C76.5776 31.2139 75.1831 31.6237 73.2707 31.6237H68.8994V21.0085H73.2707ZM75.8889 23.6267C75.3767 23.0803 74.5457 22.7957 73.3788 22.7957H71.1704V29.8365H73.5951C74.6026 29.8365 75.3653 29.569 75.8605 29.0738C76.4809 28.4534 76.7086 27.5199 76.7086 26.3132C76.7086 25.1066 76.4809 24.2244 75.8946 23.6267H75.8889Z" fill="#3AA496"/>
<path d="M81.6206 21.0085H90.3575V22.7957H83.8859V25.2033H89.6517V26.9735H83.8859V29.8365H90.5909V31.6237H81.6263V21.0085H81.6206Z" fill="#3AA496"/>
<path d="M44.2425 1.65632L41.8519 13.0912C41.795 13.3018 41.8405 13.4611 41.9771 13.575L43.3602 14.7076V14.7475H36.9171V14.7076L38.784 13.575C38.9661 13.4498 39.0857 13.2904 39.1426 13.0912L41.5104 1.65632C41.5673 1.44572 41.5161 1.28635 41.3624 1.17251L39.9793 0.0398427V0H46.4167V0.0398427L44.5726 1.17251C44.3791 1.28635 44.2652 1.44572 44.2368 1.65632H44.2425Z" fill="#1D2D4F"/>
<path d="M52.3817 14.9182C51.9036 14.9182 51.528 14.7816 51.2491 14.5084C50.9702 14.2352 50.8279 13.8539 50.8279 13.3644C50.8279 12.8749 50.9986 12.1349 51.3288 11.099L52.3362 7.95146C52.5866 7.16599 52.7119 6.61389 52.7119 6.29515C52.7119 5.89103 52.5013 5.68612 52.0801 5.68612C51.3515 5.68612 50.6514 6.21546 49.9798 7.27983C49.2114 8.4808 48.3975 10.9738 47.5437 14.7475H45.1076L47.1851 5.85118C47.2136 5.70889 47.225 5.61213 47.225 5.54952C47.225 5.48691 47.2079 5.43568 47.1851 5.40153C47.1567 5.36738 47.0941 5.32754 46.9973 5.28769L45.4264 4.67867V4.63883L50.0652 4.30301L48.9951 8.66863H49.035C49.5358 7.32536 50.1847 6.26099 50.9759 5.48122C51.767 4.69575 52.5867 4.3087 53.4404 4.3087C53.9868 4.3087 54.4137 4.46807 54.7325 4.78112C55.0455 5.09417 55.2049 5.52106 55.2049 6.0504C55.2049 6.51143 55.0227 7.32536 54.6585 8.48649L53.7364 11.4633C53.5258 12.1236 53.4233 12.6074 53.4233 12.9318C53.4233 13.3075 53.577 13.501 53.8844 13.501C54.2202 13.501 54.5333 13.2904 54.8292 12.8692C55.2504 12.2659 55.5635 11.4861 55.7741 10.5185H55.8139C55.6432 11.8617 55.2333 12.9318 54.5788 13.7287C53.9185 14.5255 53.1843 14.9239 52.3761 14.9239L52.3817 14.9182Z" fill="#1D2D4F"/>
<path d="M63.2929 11.6227C63.2929 12.4309 62.9401 13.1879 62.2343 13.8766C61.5285 14.571 60.5267 14.9125 59.2233 14.9125C58.0622 14.9125 56.9978 14.6621 56.0359 14.1555L57.2938 10.6721H57.3336L58.3638 14.258C58.4037 14.4401 58.5175 14.5426 58.6997 14.571C58.8249 14.5995 59.0127 14.6109 59.2688 14.6109C59.9006 14.6109 60.3787 14.4344 60.7146 14.0872C61.0504 13.74 61.2154 13.3018 61.2154 12.7838C61.2154 12.4082 61.0845 12.0666 60.8284 11.765C60.5723 11.4633 60.0771 11.0137 59.3485 10.4103C58.6769 9.86391 58.1817 9.36303 57.8687 8.90769C57.5556 8.45234 57.3962 7.94008 57.3962 7.36521C57.3962 6.51143 57.7377 5.78288 58.4265 5.18524C59.1095 4.58191 60.0259 4.28024 61.1756 4.28024C62.1546 4.28024 63.1279 4.45669 64.0898 4.80389L62.9173 8.2019H62.8774L61.8074 4.84373C61.7505 4.66159 61.6366 4.57053 61.4716 4.57053H61.261C60.6747 4.57053 60.2137 4.7242 59.8892 5.03156C59.5648 5.33892 59.3941 5.73735 59.3941 6.22684C59.3941 6.61958 59.5534 7.00662 59.8665 7.39366C60.1795 7.78071 60.669 8.22467 61.3236 8.72555C61.9952 9.22643 62.4904 9.69316 62.8148 10.12C63.1393 10.5469 63.2986 11.0421 63.2986 11.5999L63.2929 11.6227Z" fill="#1D2D4F"/>
<path d="M69.0189 14.9182C68.2221 14.9182 67.6358 14.7076 67.2545 14.2865L66.3495 18.0829C66.3096 18.2366 66.2982 18.339 66.3153 18.3846C66.3381 18.4358 66.4121 18.487 66.5373 18.5439L68.8026 19.4888V19.5286H62.405V19.4888L63.4979 18.7318C63.7085 18.5781 63.8394 18.3846 63.8963 18.1455L66.7934 5.82842C66.8333 5.63489 66.8446 5.50967 66.8276 5.45845C66.8048 5.40722 66.7308 5.356 66.6056 5.29908L65.0346 4.66729V4.62744L69.6735 4.29163L68.6034 8.59464H68.6433C69.6621 5.72596 70.8744 4.29163 72.2746 4.29163C72.9178 4.29163 73.4471 4.55345 73.8683 5.06571C74.2895 5.58367 74.5001 6.3236 74.5001 7.29121C74.5001 9.43133 73.9366 11.2356 72.8097 12.7041C71.6827 14.1726 70.4191 14.9069 69.0246 14.9069L69.0189 14.9182ZM67.3171 14.0132L67.2943 14.1157C67.5447 14.258 67.8236 14.3263 68.131 14.3263C69.0417 14.3263 69.8499 13.7173 70.5671 12.4992C71.4322 11.0023 71.8819 9.22074 71.9104 7.14892C71.9104 6.16993 71.6428 5.68043 71.1135 5.68043C70.5842 5.68043 69.9751 6.31222 69.332 7.57011C68.7742 8.63448 68.1025 10.7803 67.3171 14.0132Z" fill="#1D2D4F"/>
<path d="M80.2659 4.30301L78.3763 11.395C78.1657 12.2089 78.0632 12.7155 78.0632 12.9261C78.0632 13.3018 78.2169 13.4953 78.5242 13.4953C78.8601 13.4953 79.1731 13.2904 79.4691 12.8863C79.8732 12.3285 80.1919 11.5373 80.4139 10.5185H80.4538C80.3285 11.6511 79.9472 12.67 79.3097 13.5693C78.6722 14.4743 77.9266 14.9239 77.0728 14.9239C76.6118 14.9239 76.2475 14.7816 75.98 14.4914C75.7125 14.2068 75.5816 13.8197 75.5816 13.3245C75.5816 12.9033 75.6669 12.3455 75.832 11.6454L77.3859 5.79427C77.4542 5.54383 77.3859 5.38445 77.1753 5.31046L75.6043 4.67867V4.63883L80.2602 4.30301H80.2659ZM79.674 0.233364C80.0667 0.233364 80.3855 0.352892 80.6416 0.591948C80.892 0.831005 81.0173 1.13836 81.0173 1.51402C81.0173 1.9466 80.8579 2.31088 80.5448 2.60685C80.2318 2.90282 79.8504 3.04512 79.4008 3.04512C79.008 3.04512 78.6893 2.93128 78.4332 2.69792C78.1827 2.46455 78.0575 2.16289 78.0575 1.78723C78.0575 1.35465 78.2169 0.984684 78.5299 0.683018C78.843 0.381351 79.2243 0.233364 79.674 0.233364Z" fill="#1D2D4F"/>
<path d="M89.7883 4.57053L88.2971 8.6174H88.2572L87.4604 6.01625C87.4205 5.89103 87.3579 5.82842 87.2726 5.82842C87.1473 5.82842 86.9993 5.91379 86.8343 6.07886C86.5383 6.37483 86.2253 6.86433 85.8894 7.54734C85.5821 8.15068 85.2861 8.91338 85.0072 9.83545C84.7283 10.7575 84.3299 12.3968 83.8119 14.7418H81.3986L83.3281 5.86826C83.368 5.65766 83.3794 5.52675 83.3623 5.46983C83.3395 5.41291 83.2541 5.3503 83.1005 5.282L81.5466 4.67298V4.63314L86.1854 4.29732L85.2007 8.47511H85.2406C85.7699 7.04646 86.3049 5.99348 86.8457 5.31615C87.3864 4.63883 88.0182 4.29732 88.7467 4.29732C89.1679 4.29732 89.5151 4.38839 89.794 4.57053H89.7883Z" fill="#1D2D4F"/>
<path d="M98.5594 12.6529C98.8668 12.1349 99.1457 11.4235 99.3961 10.5128H99.436C99.2424 11.7707 98.844 12.818 98.2407 13.6604C97.6373 14.497 96.9259 14.9182 96.1006 14.9182C95.6509 14.9182 95.298 14.7759 95.0305 14.497C94.763 14.2181 94.6321 13.8026 94.6321 13.2619C94.6321 12.8009 94.763 12.0097 95.0305 10.8941H94.9907C94.0686 13.5807 92.9018 14.9239 91.4845 14.9239C90.8413 14.9239 90.3063 14.6507 89.8794 14.0929C89.4525 13.5408 89.2419 12.744 89.2419 11.7138C89.2419 10.5128 89.481 9.34026 89.9648 8.2019C90.4486 7.06354 91.1031 6.13008 91.9342 5.40153C92.7652 4.67298 93.636 4.3087 94.5467 4.3087C95.4574 4.3087 96.1063 4.66729 96.4535 5.37876L99.0774 4.3087H99.1172C98.9749 4.91203 98.3204 7.39936 97.1478 11.7764C97.034 12.2659 96.9771 12.6358 96.9771 12.8863C96.9771 13.3188 97.1365 13.5351 97.4609 13.5351C97.8366 13.5351 98.2008 13.2392 98.5537 12.6529H98.5594ZM96.351 5.51537C96.1802 5.19662 95.8558 5.03156 95.3663 5.03156C94.6093 5.03156 93.9092 5.52675 93.266 6.52282C92.8448 7.20583 92.4976 8.04822 92.2301 9.0386C91.9569 10.0347 91.8203 10.9681 91.8203 11.8504C91.8203 12.9546 92.1049 13.5067 92.6798 13.5067C93.2546 13.5067 93.8181 12.9318 94.3816 11.7877C94.9565 10.5697 95.6111 8.4808 96.351 5.51537Z" fill="#1D2D4F"/>
<path d="M103.95 13.9279C103.318 14.5881 102.663 14.9125 101.98 14.9125C101.519 14.9125 101.149 14.7646 100.876 14.4743C100.603 14.1783 100.466 13.8197 100.466 13.3815C100.466 13.0058 100.557 12.4252 100.739 11.6398L102.31 5.0088H100.654V4.63314H102.208C102.418 4.63314 102.572 4.57622 102.669 4.46238L105.708 0.478112H105.748L104.781 4.63314H107.154V5.0088H104.701L103.232 11.4292C103.05 12.1862 102.959 12.6757 102.959 12.8976C102.959 13.2904 103.119 13.4839 103.443 13.4839C103.767 13.4839 104.035 13.3075 104.302 12.9603C104.775 12.3285 105.122 11.5145 105.333 10.5071H105.373C105.207 11.9471 104.729 13.0855 103.944 13.9279H103.95Z" fill="#1D2D4F"/>
<path d="M111.372 4.30301L109.482 11.395C109.271 12.2089 109.169 12.7155 109.169 12.9261C109.169 13.3018 109.323 13.4953 109.63 13.4953C109.966 13.4953 110.279 13.2904 110.575 12.8863C110.979 12.3285 111.292 11.5373 111.52 10.5185H111.56C111.434 11.6511 111.053 12.67 110.415 13.5693C109.778 14.4743 109.032 14.9239 108.179 14.9239C107.718 14.9239 107.353 14.7816 107.086 14.4914C106.818 14.2011 106.687 13.8197 106.687 13.3245C106.687 12.9033 106.773 12.3455 106.938 11.6454L108.492 5.79427C108.56 5.54383 108.492 5.38445 108.281 5.31046L106.71 4.67867V4.63883L111.366 4.30301H111.372ZM110.785 0.233364C111.178 0.233364 111.497 0.352892 111.753 0.591948C112.009 0.831005 112.129 1.13836 112.129 1.51402C112.129 1.9466 111.969 2.31088 111.656 2.60685C111.343 2.90282 110.962 3.04512 110.512 3.04512C110.119 3.04512 109.801 2.93128 109.545 2.69792C109.294 2.46455 109.169 2.16289 109.169 1.78723C109.169 1.35465 109.328 0.984684 109.641 0.683018C109.954 0.381351 110.336 0.233364 110.785 0.233364Z" fill="#1D2D4F"/>
<path d="M115.971 14.9353C114.935 14.9353 114.081 14.6166 113.404 13.9677C112.726 13.3245 112.385 12.3285 112.385 10.9909C112.385 9.21504 112.943 7.65549 114.064 6.31222C115.185 4.96895 116.534 4.29732 118.111 4.29732C119.147 4.29732 120.006 4.62175 120.689 5.27062C121.372 5.91949 121.719 6.90986 121.719 8.24174C121.719 10.0347 121.156 11.5942 120.029 12.9318C118.902 14.2694 117.547 14.9353 115.971 14.9353ZM116.033 14.6223C116.563 14.6223 117.075 14.184 117.564 13.3131C118.054 12.4366 118.435 11.4007 118.708 10.1997C118.982 8.99876 119.118 7.8547 119.118 6.77895C119.118 5.33892 118.777 4.61606 118.088 4.61606C117.559 4.61606 117.046 5.05433 116.557 5.92518C116.067 6.80172 115.686 7.83763 115.413 9.0386C115.14 10.2396 115.003 11.3836 115.003 12.4594C115.003 13.8994 115.345 14.6223 116.033 14.6223Z" fill="#1D2D4F"/>
<path d="M129.711 14.9182C129.233 14.9182 128.857 14.7816 128.578 14.5084C128.299 14.2352 128.157 13.8539 128.157 13.3644C128.157 12.8749 128.328 12.1349 128.658 11.099L129.665 7.95146C129.916 7.16599 130.041 6.61389 130.041 6.29515C130.041 5.89103 129.83 5.68612 129.409 5.68612C128.68 5.68612 127.98 6.21546 127.309 7.27983C126.54 8.4808 125.726 10.9738 124.873 14.7475H122.437L124.514 5.85118C124.543 5.70889 124.554 5.61213 124.554 5.54952C124.554 5.48691 124.543 5.43568 124.514 5.40153C124.486 5.36738 124.423 5.32754 124.326 5.28769L122.755 4.67867V4.63883L127.394 4.30301L126.324 8.66863H126.364C126.865 7.32536 127.514 6.26099 128.305 5.48122C129.096 4.69575 129.916 4.3087 130.769 4.3087C131.316 4.3087 131.743 4.46807 132.061 4.78112C132.374 5.09417 132.534 5.52106 132.534 6.0504C132.534 6.51143 132.352 7.32536 131.987 8.48649L131.065 11.4633C130.855 12.1236 130.752 12.6074 130.752 12.9318C130.752 13.3075 130.906 13.501 131.213 13.501C131.549 13.501 131.862 13.2904 132.158 12.8692C132.579 12.2659 132.892 11.4861 133.103 10.5185H133.143C132.978 11.8617 132.562 12.9318 131.908 13.7287C131.247 14.5255 130.513 14.9239 129.705 14.9239L129.711 14.9182Z" fill="#1D2D4F"/>
</svg>`;

function cellText(cell) {
  return cell?.textContent?.trim() || '';
}

function createIcon(name, extra) {
  const icon = document.createElement('i');
  icon.className = `ibh-icon-${name}${extra ? ` ${extra}` : ''}`;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function createChevron(cls) {
  const icon = document.createElement('i');
  icon.className = `${cls} ibh-icon-keyboard-arrow-down`;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function applyTarget(anchor, target) {
  if (target === '_blank') {
    anchor.target = '_blank';
    anchor.rel = 'noopener';
  }
}

function linkTarget(anchor) {
  return anchor?.getAttribute('target') || '';
}

// Reads the menu from the authored nav-item blocks (each is its own block, not a
// shared <ul>). A child flagged nav-item-view-all becomes the "Ver todos" target.
// The target attribute (self/blank) set by nav-item is carried over to each link.
function readSections(fragment) {
  return [...fragment.querySelectorAll('.nav-item')].map((item) => {
    const link = item.querySelector('.nav-item-link') || item.querySelector('.nav-item-content a');
    const children = [];
    let viewAllText = '';
    let viewAllHref = '#';
    let viewAllTarget = '';

    item.querySelectorAll('.nav-item-panel .nav-item-dropdown-item').forEach((li) => {
      const anchor = li.querySelector('a');
      if (!anchor) return;
      if (li.classList.contains('nav-item-view-all')) {
        viewAllText = cellText(anchor);
        viewAllHref = anchor.getAttribute('href') || '#';
        viewAllTarget = linkTarget(anchor);
      } else {
        children.push({
          label: cellText(anchor),
          href: anchor.getAttribute('href') || '#',
          target: linkTarget(anchor),
        });
      }
    });

    return {
      label: cellText(link),
      href: link?.getAttribute('href') || '#',
      target: linkTarget(link),
      viewAllText,
      viewAllHref,
      viewAllTarget,
      children,
    };
  });
}

// Parent item: inline trigger (chevron on desktop, arrow on mobile) + a panel that
// is a full-screen drill-down on mobile and a dropdown on desktop.
function buildItem(section, showRoot) {
  const item = document.createElement('div');
  item.className = 'nav-item';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-stripe nav-stripe--parent';
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'nav-stripe-label';
  label.textContent = section.label;
  trigger.append(label, createChevron('nav-chevron nav-chevron--down'), createIcon('arrow-forward', 'nav-forward'));
  item.append(trigger);

  const panel = document.createElement('div');
  panel.className = 'nav-subpanel';

  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'nav-breadcrumb';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-breadcrumb-back';
  back.append(createIcon('arrow-back'));
  const backLabel = document.createElement('span');
  backLabel.textContent = 'Inicio';
  back.append(backLabel);
  back.addEventListener('click', (event) => { event.stopPropagation(); showRoot(); });
  breadcrumb.append(back);
  panel.append(breadcrumb);

  const accordion = document.createElement('div');
  accordion.className = 'nav-accordion';
  section.children.forEach((child) => {
    const a = document.createElement('a');
    a.className = 'nav-stripe nav-stripe--direct';
    const span = document.createElement('span');
    span.className = 'nav-stripe-label';
    span.textContent = child.label;
    a.append(span);
    a.href = child.href;
    applyTarget(a, child.target);
    accordion.append(a);
  });

  // "Ver todos" comes from the authored nav-item fields, not auto-generated.
  if (section.viewAllText) {
    const viewAll = document.createElement('a');
    viewAll.className = 'nav-viewall';
    viewAll.href = section.viewAllHref || '#';
    applyTarget(viewAll, section.viewAllTarget);
    const viewAllLabel = document.createElement('span');
    viewAllLabel.textContent = section.viewAllText;
    viewAll.append(viewAllLabel, createIcon('arrow-forward'));
    accordion.append(viewAll);
  }

  panel.append(accordion);
  item.append(panel);

  return { item, trigger, panel };
}

function setupHideOnScroll(navWrapper, nav) {
  if (document.querySelector('[data-aue-resource]')) return;

  const root = document.documentElement;
  const state = {
    mode: '', lastY: 0, direction: 0, accumulated: 0, ticking: false,
  };

  const headerHeight = () => {
    const { height } = navWrapper.getBoundingClientRect();
    return height > 0 ? height : 0;
  };

  const isFrozen = () => document.body.classList.contains('nav-open')
    || nav.getAttribute('aria-expanded') === 'true'
    || Boolean(nav.querySelector('.nav-item.is-open'));

  const publish = () => {
    root.classList.toggle('is-header-docked', state.mode === 'docked');
    root.classList.toggle('is-header-hidden', state.mode === 'hidden');
    root.classList.toggle('is-header-floating', state.mode === 'floating');
    root.style.setProperty(
      '--header-visible-height',
      state.mode === 'hidden' ? '0px' : `${Math.round(headerHeight())}px`,
    );
  };

  const resolve = (mode, force) => {
    if (mode === state.mode && !force) return;
    state.mode = mode;
    publish();
  };

  const onFrame = () => {
    const maxY = Math.max(root.scrollHeight - window.innerHeight, 0);
    const y = Math.min(Math.max(window.scrollY, 0), maxY);
    const delta = y - state.lastY;
    state.lastY = y;
    if (isFrozen()) return;
    if ((delta > 0 && state.accumulated < 0) || (delta < 0 && state.accumulated > 0)) {
      state.accumulated = 0;
    }
    state.accumulated += delta;
    if (Math.abs(state.accumulated) >= SCROLL_HYSTERESIS_PX) {
      state.direction = state.accumulated > 0 ? 1 : -1;
    }
    let { mode } = state;
    if (y <= headerHeight()) mode = 'docked';
    else if (state.direction < 0) mode = 'floating';
    else if (state.direction > 0) mode = 'hidden';
    resolve(mode, false);
  };

  const schedule = () => {
    if (state.ticking) return;
    state.ticking = true;
    window.requestAnimationFrame(() => {
      state.ticking = false;
      onFrame();
    });
  };

  navWrapper.addEventListener('focusin', () => {
    if (state.mode === 'hidden') resolve('floating', false);
  });

  window.addEventListener('resize', () => {
    resolve(state.mode, true);
    schedule();
  }, { passive: true });

  root.classList.add('is-scroll-init');
  state.lastY = Math.max(window.scrollY, 0);
  state.direction = state.lastY > 0 ? 1 : 0;
  resolve(state.lastY <= headerHeight() ? 'docked' : 'hidden', true);
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => root.classList.remove('is-scroll-init'));
  });

  window.addEventListener('scroll', schedule, { passive: true });
}

export default async function decorate(block) {
  const primaryPath = resolveFragmentPath('nav', DEFAULT_NAV_PATH);
  const fragment = await loadFragment(primaryPath) || await loadFragment(DEFAULT_NAV_PATH);
  if (!fragment) return;

  const sections = readSections(fragment);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.dataset.view = 'root';
  nav.setAttribute('aria-expanded', 'false');

  // ---- bar ----
  const bar = document.createElement('div');
  bar.className = 'nav-bar';

  // Brand/logos come from the authored header-brand block (Logo móvil / Logo desktop).
  const brandBlock = fragment.querySelector('.header-brand');
  const brandLink = brandBlock?.querySelector('.header-brand-link');
  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  brand.href = brandLink?.getAttribute('href') || '/';
  brand.setAttribute('aria-label', brandLink?.getAttribute('aria-label') || 'Inspiration Guide');

  const cloneLogo = (el) => {
    if (!el) return null;
    const media = el.matches?.('picture, img') ? el : el.querySelector?.('picture, img');
    if (!media) return null;
    const clone = media.cloneNode(true);
    [clone, ...clone.querySelectorAll('*')].forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (attr.name.startsWith('data-aue-')) node.removeAttribute(attr.name);
      });
    });
    return clone;
  };

  // Always use the authored logo: mobile/desktop wrappers if present, otherwise
  // the raw logo images from the header-brand block. Built-in mark is a last resort.
  let mobileLogo = cloneLogo(brandBlock?.querySelector('.header-brand-logo--mobile'));
  let desktopLogo = cloneLogo(brandBlock?.querySelector('.header-brand-logo--desktop'));
  if (!mobileLogo && !desktopLogo && brandBlock) {
    const pics = [...brandBlock.querySelectorAll('picture')];
    const media = pics.length ? pics : [...brandBlock.querySelectorAll('img')];
    mobileLogo = cloneLogo(media[0]);
    desktopLogo = cloneLogo(media[1]);
  }

  if (mobileLogo || desktopLogo) {
    const wrapMobile = document.createElement('span');
    wrapMobile.className = 'nav-logo nav-logo--mobile';
    wrapMobile.append(mobileLogo || desktopLogo.cloneNode(true));
    const wrapDesktop = document.createElement('span');
    wrapDesktop.className = 'nav-logo nav-logo--desktop';
    wrapDesktop.append(desktopLogo || mobileLogo.cloneNode(true));
    brand.append(wrapMobile, wrapDesktop);
  } else {
    brand.innerHTML = `<span class="nav-logo nav-logo--mobile">${LOGO_MOBILE}</span>`
      + `<span class="nav-logo nav-logo--desktop">${LOGO_DESKTOP}</span>`;
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-controls', 'nav');
  toggle.setAttribute('aria-label', 'Abrir menú');
  toggle.append(createIcon('menu', 'nav-menu-icon'), createIcon('close', 'nav-close-icon'));

  // ---- panel (overlay on mobile / inline on desktop) ----
  const panel = document.createElement('div');
  panel.className = 'nav-panel';

  const primary = document.createElement('div');
  primary.className = 'nav-primary';
  const listEl = document.createElement('div');
  listEl.className = 'nav-menu-list';

  const showRoot = () => {
    nav.dataset.view = 'root';
    nav.querySelectorAll('.nav-item').forEach((it) => {
      it.classList.remove('is-open');
      it.querySelector(':scope > .nav-stripe--parent').setAttribute('aria-expanded', 'false');
    });
  };

  const closeDesktop = (except) => {
    nav.querySelectorAll('.nav-item.is-open').forEach((it) => {
      if (it === except) return;
      it.classList.remove('is-open');
      it.querySelector(':scope > .nav-stripe--parent').setAttribute('aria-expanded', 'false');
    });
  };

  sections.forEach((section, index) => {
    if (section.children.length) {
      const { item, trigger } = buildItem(section, showRoot);
      trigger.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        if (DESKTOP.matches) {
          closeDesktop(item);
          item.classList.toggle('is-open', !open);
          trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
        } else if (open) {
          showRoot();
        } else {
          nav.dataset.view = String(index);
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      listEl.append(item);
    } else {
      const a = document.createElement('a');
      a.className = 'nav-stripe nav-stripe--direct';
      const span = document.createElement('span');
      span.className = 'nav-stripe-label';
      span.textContent = section.label;
      a.append(span);
      a.href = section.href;
      applyTarget(a, section.target);
      listEl.append(a);
    }
  });
  primary.append(listEl);

  // ---- utilities ----
  const utilities = document.createElement('div');
  utilities.className = 'nav-utilities';

  const divider = () => Object.assign(document.createElement('span'), { className: 'nav-divider' });

  // DOM order = mobile order (Reservar / ESP); desktop reorders via flex.
  const hotelsLink = fragment.querySelector('.nav-hotels a, .nav-hotels-link a');
  if (hotelsLink) {
    const a = document.createElement('a');
    a.className = 'nav-stripe nav-stripe--direct nav-util nav-util--hotels';
    const span = document.createElement('span');
    span.className = 'nav-stripe-label';
    span.textContent = cellText(hotelsLink) || 'Reservar Hoteles';
    a.append(span);
    a.href = hotelsLink.getAttribute('href') || '#';
    applyTarget(a, linkTarget(hotelsLink));
    utilities.append(a, divider());
  }

  // Reuse the decorated nav-language trigger (Nando's block) as-is — keeps its
  // click handler and the modal it mounts on document.body.
  const languageEl = fragment.querySelector('.nav-language-rendered')
    || fragment.querySelector('.nav-language');
  if (languageEl) {
    languageEl.classList.add('nav-util', 'nav-util--lang');
    utilities.append(languageEl);
  }

  panel.append(primary, utilities);
  bar.append(brand, panel, toggle);
  nav.append(bar);

  // ---- open / close (mobile) ----
  const setOpen = (open) => {
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('nav-open', open && !DESKTOP.matches);
    if (!open) showRoot();
  };

  toggle.addEventListener('click', () => setOpen(nav.getAttribute('aria-expanded') !== 'true'));

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Escape') return;
    if (DESKTOP.matches) { closeDesktop(); return; }
    if (nav.getAttribute('aria-expanded') === 'true') {
      if (nav.dataset.view !== 'root') showRoot();
      else setOpen(false);
    }
  });

  // Desktop dropdowns open on click; close when clicking outside a nav item.
  document.addEventListener('click', (event) => {
    if (DESKTOP.matches && !event.target.closest('.nav-item')) closeDesktop();
  });

  DESKTOP.addEventListener('change', () => { setOpen(false); showRoot(); });

  block.textContent = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(backdrop, nav);
  block.append(navWrapper);

  setupHideOnScroll(navWrapper, nav);
}
