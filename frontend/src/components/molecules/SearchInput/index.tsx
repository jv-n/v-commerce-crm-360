import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/atoms/input-group"
import SearchIcon from "@mui/icons-material/Search"


export default function SearchInput() {
    return (
        <InputGroup className="w-100 rounded-none border-0 border-b border-primary bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-primary">
            <InputGroupAddon>
                <SearchIcon sx={{ color: "#74FF60" }} />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." className="bg-transparent rounded-md"/>
        </InputGroup>
    );
}