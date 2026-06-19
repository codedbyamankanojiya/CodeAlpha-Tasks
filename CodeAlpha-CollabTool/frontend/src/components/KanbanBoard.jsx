/**
 * KanbanBoard is the top-level DragDropContext wrapper.
 * The actual implementation is split into Column.jsx and TaskCard.jsx
 * and orchestrated directly in BoardView.jsx.
 * This component is exported for potential standalone usage.
 */
import { DragDropContext } from '@hello-pangea/dnd';

const KanbanBoard = ({ onDragEnd, onDragStart, children }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ alignItems: 'flex-start' }}>
        {children}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
