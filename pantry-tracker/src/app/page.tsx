"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import {
  Autocomplete,
  AutocompleteItem,
  Input,
  DatePicker,
} from "@nextui-org/react";
import { parseDate } from "@internationalized/date";
import { Pencil, Trash2, Plus } from "lucide-react";
import { collection, addDoc, QuerySnapshot, query, onSnapshot, DocumentData, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState, useEffect } from "react";

export default function Home() {
  const [items, setItems] = useState<{ id: string; item: string; quantity: number; storage: string; category: string; expiration: string; }[]>([]);
  const [newItem, setNewItem] = useState({
    item: "",
    quantity: 0,
    storage: "",
    category: "",
    expiration: "",
  });
  const [editItem, setEditItem] = useState<{ id: string; item: string; quantity: number; storage: string; category: string; expiration: string; }>({ id: "", item: "", quantity: 0, storage: "", category: "", expiration: "" });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<{ id: string; item: string; quantity: number; storage: string; category: string; expiration: string; }[]>([]);

  const addItem = async () => {

    const { item, quantity, storage, category, expiration } = newItem;
    const allFieldsFilled = item !== "" && storage !== "" && category !== "" && expiration !== "";
    const expirationDate = new Date(expiration);
    const isExpirationValid = expirationDate >= new Date();
    const isQuantityValid = quantity > 0 || (quantity === 0 && storage === "Out of Stock");

    if (allFieldsFilled && isExpirationValid && isQuantityValid) {
      const docRef = await addDoc(collection(db, "pantry"), {
        item,
        quantity,
        storage,
        category,
        expiration,
      });
      setItems([...items, { id: docRef.id, ...newItem }]);
      setNewItem({
        item: "",
        quantity: 0,
        storage: "",
        category: "",
        expiration: "",
      });
      onOpenChange();
    } else {
      console.error("Invalid input: Please ensure all fields are filled, the expiration date is valid, and the quantity is correct.");
    }
  };



  // Read all pantry items from database
  useEffect(() => {
    const q = query(collection(db, "pantry"));
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      let itemsArray: any[] | ((prevState: { item: string; quantity: number; storage: string; category: string; expiration: string; }[]) => { item: string; quantity: number; storage: string; category: string; expiration: string; }[]) = [];
      querySnapshot.forEach((doc) => {
        itemsArray.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArray);
      setFilteredItems(itemsArray);
    })
    
    return () => unsubscribe();
  }, []);

  const handleFilter = (query: string) => {
    const filtered = items.filter((item) =>
      item.item.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.storage.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  // Update a pantry item in database
  const updateItem = async () => {
    const { id, ...updatedData } = editItem;
    const expirationDate = new Date(updatedData.expiration);
    const isExpirationValid = expirationDate >= new Date();
    const allFieldsFilled = editItem.item !== "" && editItem.storage !== "" && editItem.category !== "" && editItem.expiration !== "";

    if (!isExpirationValid) {
      console.error("Invalid input: Please ensure the expiration date is valid.");
      return
    }
    if(!allFieldsFilled) {
      console.error("Invalid input: Please ensure all fields are filled.");
      return
    }
    if (updatedData.quantity === 0 && updatedData.storage !== "Out of Stock") {
      updatedData.storage = "Out of Stock";
    } 
    if (updatedData.quantity > 0 && updatedData.storage === "Out of Stock") {
       switch (updatedData.category) {
        case "Fruit & Vegetables":
          updatedData.storage = "In Pantry";
          break;
        case "Meat, Poultry, Fish":
          updatedData.storage = "In Fridge";
          break;
        case "Dairy & Eggs":
          updatedData.storage = "In Fridge";
          break;
        case "Breads, Cereal & Grains":
          updatedData.storage = "In Pantry";
          break;
        case "Dried & Canned Goods":
          updatedData.storage = "In Pantry";
          break;
        case "Other":
          updatedData.storage = "In Pantry";
          break;
        default:
          updatedData.storage = "In Pantry";
          break;
       }
    }
  
    const docRef = doc(db, "pantry", id);
    await setDoc(docRef, updatedData);
    setEditItem({
      id: "",
      item: "",
      quantity: 0,
      storage: "",
      category: "",
      expiration: "",
    });
    onEditOpenChange(); 
  };


  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, "pantry", id));
  }

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();



  const categories = [
    "Fruit & Vegetables",
    "Meat, Poultry, Fish",
    "Dairy & Eggs",
    "Breads, Cereal & Grains",
    "Dried & Canned Goods",
    "Other",
  ];

  const storages = ["In Pantry", "In Fridge", "In Freezer", "Out of Stock"];

  const columns = [
    { name: "ITEM/FOOD", uid: "item" },
    { name: "QUANTITY", uid: "quantity" },
    { name: "STORAGE", uid: "storage" },
    { name: "CATEGORY", uid: "category" },
    { name: "EXPIRATION DATE", uid: "expiration" },
    { name: "ACTIONS", uid: "actions" },
  ];

  const renderCell = React.useCallback(
    (items: any, columnKey: string | number) => {
      const cellValue = items[columnKey];
      const storageColorMap: { [key: string]: string } = {
        "In Pantry": "success",
        "In Fridge": "warning",
        "In Freezer": "primary",
        "Out of Stock": "danger",
      };
    
      const categoryColorMap: { [key: string]: string} = {
        "Fruit & Vegetables": "success",
        "Meat, Poultry, Fish": "warning",
        "Dairy & Eggs": "primary",
        "Breads, Cereal & Grains": "danger",
        "Dried & Canned Goods": "secondary",
        Other: "default",
      };
  
      switch (columnKey) {
        case "storage":
          return (
            <Chip
              className="capitalize"
              color={
                storageColorMap[items.storage] as
                  | "default"
                  | "primary"
                  | "secondary"
                  | "success"
                  | "warning"
                  | "danger"
              }
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
          );
        case "category":
          return (
            <Chip
              className="capitalize"
              color={
                categoryColorMap[items.category] as
                  | "default"
                  | "primary"
                  | "secondary"
                  | "success"
                  | "warning"
                  | "danger"
              }
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex items-center gap-2">
              <Tooltip content="Edit entry">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50"
                onClick={() => {
                  setEditItem(items);
                  onEditOpen();
                }}
                >
                  <Pencil />
                </span>
              </Tooltip>
              <Tooltip color="danger" content="Delete entry">
                <span
                  className="text-lg text-danger cursor-pointer active:opacity-50"
                  onClick={() => deleteItem(items.id)} 
                >
                  <Trash2 />
                </span>
              </Tooltip>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [onEditOpen]
  );

  return (
    <>
      <h1 className="text-3xl font-bold text-center mt-5">Pantry Tracker</h1>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add Item
              </ModalHeader>
              <ModalBody>
              <div className="flex flex-col items-center space-y-4">
                <Input
                  type="text"
                  label="Item"
                  value={newItem.item}
                  className="w-full max-w-xs"
                  onChange={(e) =>
                    setNewItem({ ...newItem, item: e.target.value })
                  }
                />
                <Input
                  type="number"
                  label="Quantity"
                  value={newItem.quantity.toString()}
                  className="w-full max-w-xs"
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      quantity: parseInt(e.target.value, 10),
                    })
                  }
                />
                <Autocomplete
                  label="Storage"
                  className="w-full max-w-xs"
                  defaultItems={storages.map((storage) => ({
                    value: storage,
                    label: storage,
                  }))}
                  
                  selectedKey={newItem.storage}
                  onSelectionChange={(selected) => {
                    setNewItem((prev) => ({
                      ...prev,
                      storage: selected as string,
                    }));
                  }}
                >
                  {(item) => (
                    <AutocompleteItem key={item.value}>
                      {item.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Autocomplete
                  label="Category"
                  className="max-w-xs"
                  defaultItems={categories.map((category) => ({
                    value: category,
                    label: category,
                  }))}
                  selectedKey={newItem.category}
                  onSelectionChange={(selected) => {
                    setNewItem((prev) => ({
                      ...prev,
                      category: selected as string,
                    }));
                  }}
                >
                  {(item) => (
                    <AutocompleteItem key={item.value}>
                      {item.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <DatePicker
                  label="Expiration Date"
                  value={
                    newItem.expiration ? parseDate(newItem.expiration) : null
                  }
                 className="w-full max-w-xs"
                  onChange={(date) =>
                    setNewItem({
                      ...newItem,
                      expiration: date ? date.toString().split("T")[0] : "",
                    })
                  }
                />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={addItem}>
                  Add
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Update Item
              </ModalHeader>
              <ModalBody>
              <div className="flex flex-col items-center space-y-4">
                <Input
                  type="text"
                  label="Item"
                  value={editItem.item}
                  className="w-full max-w-xs"
                  onChange={(e) =>
                    setEditItem({ ...editItem, item: e.target.value })
                  }
                />
                <Input
                  type="number"
                  label="Quantity"
                  value={editItem.quantity.toString()}
                  className="w-full max-w-xs"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      quantity: parseInt(e.target.value, 10),
                    })
                  }
                />
                <Autocomplete
                  label="Storage"
                  className="max-w-xs"
                  defaultItems={storages.map((storage) => ({
                    value: storage,
                    label: storage,
                  }))}
                  selectedKey={editItem.storage}
                  onSelectionChange={(selected) => {
                    setEditItem((prev) => ({
                      ...prev,
                      storage: selected as string,
                    }));
                  }}
                >
                  {(item) => (
                    <AutocompleteItem key={item.value}>
                      {item.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Autocomplete
                  label="Category"
                  className="max-w-xs"
                  defaultItems={categories.map((category) => ({
                    value: category,
                    label: category,
                  }))}
                  selectedKey={editItem.category}
                  onSelectionChange={(selected) => {
                    setEditItem((prev) => ({
                      ...prev,
                      category: selected as string,
                    }));
                  }}
                >
                  {(item) => (
                    <AutocompleteItem key={item.value}>
                      {item.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <DatePicker
                  label="Expiration Date"
                  className="w-full max-w-xs"
                  value={
                    editItem.expiration ? parseDate(editItem.expiration) : null
                  }
                  onChange={(date) =>
                    setEditItem({
                      ...editItem,
                      expiration: date ? date.toString().split("T")[0] : "",
                    })
            
                  }
                />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={updateItem}>
                  Update
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="relative w-[70%] mx-auto mt-[150px]">
      <Input
  className="absolute top-[-50px] left-0 mb-5 w-[200px]"
  type="text"
  placeholder="Search Items"
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
    handleFilter(e.target.value);
  }}
/>
      <Button onPress={onOpen} className="absolute top-[-50px] right-0 mb-5" color="success">
        <Plus />
      </Button>
      <Table aria-label="Example table with custom cells" className="w-full">
        
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "center"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={filteredItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
