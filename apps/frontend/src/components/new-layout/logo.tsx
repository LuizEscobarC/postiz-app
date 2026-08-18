'use client';

// [lampagos] O logo do upstream era um SVG inline com o roxo #612BD3 chumbado.
// Aqui ele vira um asset, para que trocar a marca nao seja mais mexer em codigo.
export const Logo = () => {
  return (
    <img
      src="/brand/icon-128.png"
      alt=""
      width={60}
      height={60}
      className="mt-[8px] min-w-[60px] min-h-[60px] rounded-[14px]"
    />
  );
};
