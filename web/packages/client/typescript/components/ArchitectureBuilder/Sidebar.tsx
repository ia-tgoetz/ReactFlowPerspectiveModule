import React, { useState, useMemo } from 'react';

export interface PaletteItem {
    id: string;
    category?: string;
    label: string;
    tooltip?: string;
    svg: string;
    supportedConnections?: string[];
    configs?: any;
    defaultConfigs?: any;
    style?: any;
    labelStyle?: any;
    swappableWith?: string[];
}

export interface SidebarProps {
    paletteItems: PaletteItem[];
    isOpen: boolean;
    toggleSidebar: () => void;
    onDragStartItem: (item: PaletteItem) => void;
}

export const Sidebar = ({ paletteItems, isOpen, toggleSidebar, onDragStartItem }: SidebarProps) => {
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const { containerItems, groupedItems } = useMemo(() => {
        const containers: PaletteItem[] = [];
        const groups: Record<string, PaletteItem[]> = {};

        paletteItems.forEach(item => {
            if (item.id === 'container') {
                containers.push(item);
            } else {
                const category = item.category || 'General';
                if (!groups[category]) groups[category] = [];
                groups[category].push(item);
            }
        });
        return { containerItems: containers, groupedItems: groups };
    }, [paletteItems]);

    const toggleCategory = (category: string) => {
        setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
    };

    const onDragStart = (event: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
        onDragStartItem(item);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{ display: 'flex', height: '100%', position: 'relative', zIndex: 5 }}>
            <div style={{ width: isOpen ? '250px' : '0px', backgroundColor: 'var(--neutral-20)', borderRight: isOpen ? '1px solid var(--neutral-40)' : 'none', overflowY: 'auto', overflowX: 'hidden', transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--neutral-90)' }}>Palette</h3>
                    
                    {containerItems.length > 0 && (
                        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--neutral-40)' }}>
                            {containerItems.map((item) => (
                                <div 
                                    key={item.id} 
                                    draggable 
                                    onDragStart={(e) => onDragStart(e, item)} 
                                    style={{ border: '1px dashed var(--neutral-50)', backgroundColor: 'var(--neutral-30)', padding: '10px', marginBottom: '8px', cursor: 'grab', display: 'flex', alignItems: 'center', borderRadius: '4px', fontWeight: 'bold' }}
                                >
                                    <div style={{ width: '20px', height: '20px', marginRight: '10px' }} dangerouslySetInnerHTML={{ __html: item.svg }} />
                                    <span style={{ color: 'var(--neutral-90)', fontSize: '14px' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {Object.entries(groupedItems).map(([category, items]) => {
                        const isCollapsed = collapsedCategories[category];
                        return (
                            <div key={category} style={{ marginBottom: '15px' }}>
                                <div onClick={() => toggleCategory(category)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--neutral-30)', padding: '8px 10px', borderRadius: '4px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--neutral-90)', userSelect: 'none' }}>
                                    <span>{category}</span><span style={{ fontSize: '12px' }}>{isCollapsed ? '▶' : '▼'}</span>
                                </div>
                                {!isCollapsed && (
                                    <div style={{ paddingLeft: '5px' }}>
                                        {items.map((item) => (
                                            <div 
                                                key={item.id} 
                                                draggable 
                                                onDragStart={(e) => onDragStart(e, item)} 
                                                style={{ border: '1px solid var(--neutral-40)', backgroundColor: 'var(--neutral-10)', padding: '8px', marginBottom: '8px', cursor: 'grab', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                                            >
                                                <div style={{ width: '20px', height: '20px', marginRight: '10px' }} dangerouslySetInnerHTML={{ __html: item.svg }} />
                                                <span style={{ color: 'var(--neutral-90)', fontSize: '14px' }}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div onClick={toggleSidebar} style={{ width: '20px', height: '50px', backgroundColor: 'var(--neutral-40)', border: '1px solid var(--neutral-50)', borderLeft: 'none', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '20px', color: 'var(--neutral-90)' }}>
                {isOpen ? '◀' : '▶'}
            </div>
        </div>
    );
};