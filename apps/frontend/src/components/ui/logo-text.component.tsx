'use client';

import React from 'react';
import { useVariables } from '@gitroom/react/helpers/variable.context';

// [lampagos] O upstream desenhava a palavra "Postiz" em vetor. Como o nome
// agora e a variavel BRAND_NAME, um wordmark chumbado sairia de sincronia na
// hora que o nome mudasse. Aqui e icone + o nome como texto.
export const LogoTextComponent = () => {
  const { brandName } = useVariables();
  return (
    <div className="flex items-center gap-[10px]">
      <img
        src="/brand-icon-64.png"
        alt=""
        width={33}
        height={33}
        className="rounded-[8px]"
      />
      <span className="text-[26px] font-bold tracking-[-0.02em] leading-none">
        {brandName}
      </span>
    </div>
  );
};
