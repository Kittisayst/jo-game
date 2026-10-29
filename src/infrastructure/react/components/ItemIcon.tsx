import React from 'react';

export interface ItemIconProps
{
    iconImage?: string;
    icon?: string;
    size?: number;
    className?: string;
}

/**
 * Renders a crisp nearest-neighbor pixel-art item icon when `iconImage` is available,
 * falling back cleanly to the item's emoji `icon`.
 */
export const ItemIcon: React.FC<ItemIconProps> = ({
    iconImage,
    icon = '📦',
    size = 24,
    className = '',
}) =>
{
    if (iconImage)
    {
        return (
            <img
                src={iconImage}
                alt=""
                aria-hidden="true"
                width={size}
                height={size}
                className={`pixel-art inline-block select-none object-contain flex-shrink-0 ${className}`.trim()}
                style={{ width: size, height: size, imageRendering: 'pixelated' }}
            />
        );
    }

    return (
        <span aria-hidden="true" className={className}>
            {icon}
        </span>
    );
};

