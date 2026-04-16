import * as React from 'react';
import ReactJson, { InteractionProps } from 'react-json-view';
import { ComponentProps } from '@inductiveautomation/perspective-client';
import { observer } from 'mobx-react';

export interface JsonEditorProps {
    data: object;
    theme: string;
    customTheme: {
        backgroundColor?: string;
        keyColor?: string;
        stringColor?: string;
        numberColor?: string;
        booleanColor?: string;
        bracketColor?: string;
    };
    editable: boolean;
    style?: any;
}

export const JsonEditor = observer((props: ComponentProps<JsonEditorProps>) => {
    const { data, theme, customTheme, editable, style } = props.props;

    const getActiveTheme = () => {
        // Detect if user has actually entered any custom values
        const hasCustomValues = customTheme && 
            Object.values(customTheme).some(val => val !== undefined && val !== "");

        if (!hasCustomValues) {
            return theme || 'monokai';
        }

        // FULL mapping for base-16 to ensure nothing "goes missing"
        return {
            base00: customTheme.backgroundColor || 'transparent', 
            base07: customTheme.bracketColor || '#f8f8f2',      
            base0D: customTheme.keyColor || '#66d9ef',          
            base0B: customTheme.stringColor || '#a6e22e',       
            base09: customTheme.numberColor || '#ae81ff',       
            base0E: customTheme.booleanColor || '#fd971f',      
            
            // Missing internal fields filled with defaults to prevent invisible elements
            base08: '#f92672', // Nulls/Errors
            base0A: '#f4bf75', // Classes/Tags
            base0C: '#a1efe4', // Special/Regex
            base0F: '#cc6633', // Integers
            base01: '#383830', base02: '#49483e', base03: '#75715e',
            base04: '#a59f85', base05: '#f8f8f2', base06: '#f5f4f1'
        };
    };

    const activeTheme = getActiveTheme();

    const handleUpdate = (edit: InteractionProps) => {
        if (props.store?.props) {
            props.store.props.write('data', edit.updated_src);
        }
    };

    return (
        <div 
            {...props.emit({
                classes: ['ia_jsonEditor', 'perspective-component'] 
            })} 
            style={{ 
                height: '100%', 
                width: '100%', 
                overflow: 'auto',
                ...style 
            }}
        >
            <ReactJson 
                src={data || {}}
                theme={activeTheme as any}
                onEdit={editable !== false ? handleUpdate : undefined}
                onAdd={editable !== false ? handleUpdate : undefined}
                onDelete={editable !== false ? handleUpdate : undefined}
                displayDataTypes={false}
                displayObjectSize={true}
                enableClipboard={true}
                style={{ backgroundColor: 'transparent', padding: '10px' }}
            />
        </div>
    );
});