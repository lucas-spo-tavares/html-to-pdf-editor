import { Box, ChevronDown, ChevronRight, Layers, Type as TypeIcon } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import type { EditorObject } from '@/editor/document/types';

type EditorObjectTreeProps = {
  object: EditorObject;
  selectedId: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  depth?: number;
};

const getTextTitle = (object: EditorObject) => {
  if (object.type !== 'text') return undefined;

  const content = (object.content ?? '').replace(/\s+/g, ' ').trim();
  if (!content) return undefined;

  return content.length > 80 ? `${content.slice(0, 77)}...` : content;
};

const getTreeIcon = (object: EditorObject) => {
  if (object.type === 'text') return <TypeIcon size={14} />;
  if (object.type === 'group') return <Layers size={14} />;
  return <Box size={14} />;
};

export function EditorObjectTree({
  object,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  depth = 0,
}: EditorObjectTreeProps) {
  const hasChildren = Boolean(object.children?.length);
  const expanded = expandedIds.has(object.id);

  return (
    <li className="tree-item">
      <div className={selectedId === object.id ? 'tree-row active' : 'tree-row'} style={{ paddingLeft: 8 + depth * 14 }}>
        {hasChildren ? (
          <Button
            aria-label={expanded ? 'Recolher objeto' : 'Expandir objeto'}
            onClick={() => onToggle(object.id)}
            variant="treeToggle"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Button>
        ) : (
          <span className="tree-spacer" />
        )}
        <Button onClick={() => onSelect(object.id)} title={getTextTitle(object)} variant="treeSelect">
          {getTreeIcon(object)}
          <span>{object.type}</span>
        </Button>
      </div>
      {hasChildren && expanded && (
        <ul className="tree-list">
          {object.children?.map((child) => (
            <EditorObjectTree
              depth={depth + 1}
              expandedIds={expandedIds}
              key={child.id}
              object={child}
              onSelect={onSelect}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
